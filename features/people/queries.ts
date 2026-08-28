import { createClient } from "@/lib/supabase/server";

const PEOPLE_PAGE_SIZE = 20;

export type DirectoryEntry = {
  id: string;
  full_name: string;
  job_title: string | null;
  department: { name: string; business_unit: { name: string; country: { name: string } } } | null;
};

export async function searchPeople(query: string, page: number) {
  const supabase = await createClient();
  const from = page * PEOPLE_PAGE_SIZE;
  const to = from + PEOPLE_PAGE_SIZE - 1;

  let request = supabase
    .from("profiles")
    .select(
      `
      id, full_name, job_title,
      department:departments (
        name,
        business_unit:business_units ( name, country:countries ( name ) )
      )
    `,
      { count: "exact" }
    )
    .order("full_name")
    .range(from, to);

  if (query.trim()) {
    request = request.ilike("full_name", `%${query.trim()}%`);
  }

  const { data, error, count } = await request;

  if (error) {
    console.error("searchPeople error:", error.message);
    return { people: [] as DirectoryEntry[], total: 0, error: "Unable to load the directory." };
  }

  return { people: (data ?? []) as unknown as DirectoryEntry[], total: count ?? 0, error: null };
}