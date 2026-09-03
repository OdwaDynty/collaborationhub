import { validateApiKey, getServiceClient } from "@/lib/api/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

// GET /api/v1/messages           → list the key owner's conversations
// GET /api/v1/messages?conversationId=... → the message thread for one
export async function GET(request: Request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!auth.ownerProfileId) {
    return NextResponse.json(
      { error: "This API key has no owner assigned and cannot access messages." },
      { status: 500 }
    );
  }

  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (conversationId) {
    // Confirm the key's owner is actually a participant before returning
    // anything — this is the same check the app itself relies on via RLS,
    // but the service-role client bypasses RLS, so it must be done explicitly.
    const { data: conversation } = await supabase
      .from("conversations")
      .select("participant_one_id, participant_two_id")
      .eq("id", conversationId)
      .single();

    if (
      !conversation ||
      (conversation.participant_one_id !== auth.ownerProfileId &&
        conversation.participant_two_id !== auth.ownerProfileId)
    ) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("direct_messages")
      .select("id, content, sender_id, created_at")
      .eq("conversation_id", conversationId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: "Unable to fetch messages." }, { status: 500 });
    }
    return NextResponse.json({ messages: data });
  }

  // No conversationId: list conversations this owner is part of.
  const { data, error } = await supabase
    .from("conversations")
    .select(
      `id, participant_one_id, participant_two_id,
       one:profiles!conversations_participant_one_id_fkey ( id, full_name ),
       two:profiles!conversations_participant_two_id_fkey ( id, full_name )`
    )
    .or(`participant_one_id.eq.${auth.ownerProfileId},participant_two_id.eq.${auth.ownerProfileId}`);

  if (error) {
    return NextResponse.json({ error: "Unable to fetch conversations." }, { status: 500 });
  }

  const conversations = (data ?? []).map((c) => {
    const isOne = c.participant_one_id === auth.ownerProfileId;
    const other = isOne ? c.two : c.one;
    return { conversationId: c.id, otherParticipant: other };
  });

  return NextResponse.json({ conversations });
}

const sendMessageSchema = z.object({
  recipientProfileId: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
});

// POST /api/v1/messages — send a message AS the key's owner, to a named
// recipient. Finds or creates the conversation, same as the app's UI does.
export async function POST(request: Request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!auth.canWrite) {
    return NextResponse.json(
      { error: "This API key does not have write access." },
      { status: 403 }
    );
  }
  if (!auth.ownerProfileId) {
    return NextResponse.json(
      { error: "This API key has no owner assigned and cannot send messages." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  if (parsed.data.recipientProfileId === auth.ownerProfileId) {
    return NextResponse.json({ error: "Cannot send a message to yourself." }, { status: 400 });
  }

  const supabase = getServiceClient();
  const [participantOne, participantTwo] = [auth.ownerProfileId, parsed.data.recipientProfileId].sort();

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("participant_one_id", participantOne)
    .eq("participant_two_id", participantTwo)
    .maybeSingle();

  let conversationId = existing?.id as string | undefined;

  if (!conversationId) {
    const { data: created, error: createError } = await supabase
      .from("conversations")
      .insert({ participant_one_id: participantOne, participant_two_id: participantTwo })
      .select("id")
      .single();

    if (createError || !created) {
      return NextResponse.json({ error: "Unable to start conversation." }, { status: 500 });
    }
    conversationId = created.id;
  }

  const { data: message, error: messageError } = await supabase
    .from("direct_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: auth.ownerProfileId,
      content: parsed.data.content,
    })
    .select("id")
    .single();

  if (messageError || !message) {
    console.error("API sendMessage error:", messageError?.message);
    return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  }

  await supabase.from("audit_events").insert({
    actor_id: auth.ownerProfileId,
    action: "api_message_sent",
    target_type: "direct_message",
    target_id: message.id,
    metadata: { api_key_id: auth.keyId, conversation_id: conversationId },
  });

  return NextResponse.json({ id: message.id, conversationId }, { status: 201 });
}