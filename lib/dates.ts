/**
 * Returns the Monday of the week containing the given date, as a
 * plain YYYY-MM-DD string — the "week key" used to cache one insight
 * digest per week rather than regenerating it on every click.
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  // Distance back to the most recent Monday. Sunday (0) is a special
  // case — it needs to go back 6 days, not forward.
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}