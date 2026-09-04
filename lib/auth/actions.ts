"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Stored in auth.users.user_metadata for now.
      // Slice 3b's trigger reads this to populate profiles.full_name.
      data: { full_name: fullName },
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/login`,
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/forgot-password?sent=1");
}

/**
 * Updates the currently signed-in user's password.
 * Called from the Settings page's "Change password" form.
 *
 * Uses Supabase's built-in updateUser() method, which works because the
 * user is already authenticated (has a valid session) — this is different
 * from requestPasswordReset() above, which is for someone who is NOT
 * logged in and needs an emailed reset link instead.
 */
export async function updatePassword(
  formData: FormData
): Promise<{ error: string | null; success?: boolean }> {
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Basic validation before we even talk to Supabase — catches obvious
  // mistakes (too short, mismatched fields) with a fast, clear message.
  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const supabase = await createClient();

  // updateUser() updates the CURRENTLY authenticated session's user.
  // No need to pass an email or old password — Supabase already knows
  // who's calling this because of the active session cookie.
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    // Log the real error server-side for debugging, but never show
    // Supabase's raw error message to the user — show a generic,
    // friendly one instead.
    console.error("updatePassword error:", error.message);
    return { error: "Unable to update password. Please try again." };
  }

  return { error: null, success: true };
}