import { createClient } from "@/lib/supabase/server";

export type UpcomingBirthday = {
  id: string;
  full_name: string;
  birthday: string;
  days_until: number;
};

export async function getUpcomingBirthdays(): Promise<{
  birthdays: UpcomingBirthday[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_upcoming_birthdays", {
    days_ahead: 30,
  });

  if (error) {
    console.error("getUpcomingBirthdays error:", error.message);
    return { birthdays: [], error: "Unable to load birthdays." };
  }

  return { birthdays: (data ?? []) as UpcomingBirthday[], error: null };
}

export type BirthdayWish = {
  id: string;
  content: string;
  created_at: string;
  author: { full_name: string };
};

export async function getWishesForProfiles(
  profileIds: string[]
): Promise<Record<string, BirthdayWish[]>> {
  if (profileIds.length === 0) return {};

  const supabase = await createClient();

  // Only wishes from the last 24 hours — this page only ever shows
  // profileIds for TODAY's birthday, but wishes accumulate across every
  // past year's occurrence too. Without this filter, next year's
  // birthday would show this year's messages still mixed in alongside
  // new ones, rather than starting fresh each year.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("birthday_wishes")
    .select(
      `id, content, created_at, profile_id, author:profiles!birthday_wishes_author_id_fkey ( full_name )`
    )
    .in("profile_id", profileIds)
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getWishesForProfiles error:", error.message);
    return {};
  }

  const grouped: Record<string, BirthdayWish[]> = {};
  for (const row of data as unknown as (BirthdayWish & { profile_id: string })[]) {
    grouped[row.profile_id] = grouped[row.profile_id] ?? [];
    grouped[row.profile_id].push(row);
  }
  return grouped;
}