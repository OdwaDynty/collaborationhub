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