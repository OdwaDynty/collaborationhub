"use server";

import { createClient } from "@/lib/supabase/server";
import { createBirthdayWishSchema } from "./schema";
import { revalidatePath } from "next/cache";

export async function createBirthdayWish(
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to leave a message." };
  }

  const parsed = createBirthdayWishSchema.safeParse({
    profileId: formData.get("profileId"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.from("birthday_wishes").insert({
    profile_id: parsed.data.profileId,
    author_id: user.id,
    content: parsed.data.content,
  });

  if (error) {
    console.error("createBirthdayWish error:", error.message);
    return { error: "Unable to post message. Please try again." };
  }

  revalidatePath("/birthdays");
  return { error: null };
}