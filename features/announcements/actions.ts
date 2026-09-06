"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createAnnouncementSchema,
  createAnnouncementCommentSchema,
} from "./schema";
import { revalidatePath } from "next/cache";
import { generateText } from "@/lib/ai/openai";

export async function createAnnouncement(
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const parsed = createAnnouncementSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    scope: formData.get("scope"),
    department_id: formData.get("department_id") || undefined,
    eventAt: formData.get("eventAt") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("can_create_announcements")
    .eq("id", user.id)
    .single();

  if (!profile?.can_create_announcements) {
    return { error: "You don't have permission to create announcements." };
  }

  if (parsed.data.scope === "department" && !parsed.data.department_id) {
    return { error: "Select a department for a department-scoped announcement." };
  }

  let eventAtIso: string | null = null;
  if (parsed.data.eventAt) {
    const parsedDate = new Date(parsed.data.eventAt);
    if (!isNaN(parsedDate.getTime())) {
      eventAtIso = parsedDate.toISOString();
    }
  }

  // Generate a short TL;DR before inserting. If this fails for any
  // reason (API down, rate-limited, misconfigured key), it's treated
  // as non-fatal — `summary` is nullable specifically so an AI hiccup
  // can never block a real official announcement from being
  // published. The generated text is capped hard at 280 characters as
  // a defensive limit, independent of whatever the AI actually
  // returns.
  let summary: string | null = null;
  const { text: generatedSummary } = await generateText({
    systemPrompt:
      "Summarize the following company announcement in exactly one short, plain sentence — the key takeaway an employee needs, nothing else. No preamble.",
    userPrompt: parsed.data.content,
    maxTokens: 60,
  });
  if (generatedSummary) {
    summary = generatedSummary.slice(0, 280);
  }

  const { error } = await supabase.from("announcements").insert({
    author_id: user.id,
    title: parsed.data.title,
    content: parsed.data.content,
    summary,
    scope: parsed.data.scope,
    department_id: parsed.data.scope === "department" ? parsed.data.department_id : null,
    event_at: eventAtIso,
  });

  if (error) {
    console.error("createAnnouncement error:", error.message);
    return { error: "Unable to create announcement. Please try again." };
  }

  revalidatePath("/announcements");
  revalidatePath("/calendar");
  return { error: null };
}

export async function createAnnouncementComment(
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to comment." };
  }

  const parsed = createAnnouncementCommentSchema.safeParse({
    announcementId: formData.get("announcementId"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.from("announcement_comments").insert({
    announcement_id: parsed.data.announcementId,
    author_id: user.id,
    content: parsed.data.content,
  });

  if (error) {
    console.error("createAnnouncementComment error:", error.message);
    return { error: "Unable to post comment. Please try again." };
  }

  revalidatePath("/announcements");
  return { error: null };
}

export async function deleteAnnouncementComment(
  commentId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("soft_delete_announcement_comment", {
    p_comment_id: commentId,
  });

  if (error) {
    console.error("deleteAnnouncementComment error:", error.message);
    return {
      error: error.message.includes("permission")
        ? "You can only delete your own comments."
        : "Unable to delete comment. Please try again.",
    };
  }

  revalidatePath("/announcements");
  return { error: null };
}

/**
 * Takes a manager's rough draft text and returns a clearer, more
 * professional version — same idea as the TL;DR and weekly digest
 * features, just applied at draft time instead of after publishing.
 *
 * Deliberately does NOT publish anything itself — it only returns
 * improved text for the composer to drop back into the textarea, so
 * the person writing it still reviews and can further edit before
 * ever clicking the real Publish button. The AI never gets to publish
 * on someone's behalf, only to suggest wording.
 */
export async function polishAnnouncementDraft(
  rawContent: string
): Promise<{ text: string | null; error: string | null }> {
  if (!rawContent || rawContent.trim().length < 10) {
    return { text: null, error: "Write a bit more before polishing." };
  }

  const { text, error } = await generateText({
    systemPrompt:
      "You improve a rough draft of a company announcement into clear, professional wording suitable for an official internal communication. Preserve every factual detail, date, and name exactly as given — never invent or omit information. Return ONLY the improved announcement text itself, with no preamble, no quotation marks around it, and no explanation.",
    userPrompt: rawContent,
    maxTokens: 400,
  });

  if (error || !text) {
    return { text: null, error: error ?? "Unable to polish this draft right now." };
  }

  return { text, error: null };
}