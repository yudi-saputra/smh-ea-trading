import {
  eachDayOfInterval,
  format,
  startOfDay,
  subDays,
} from "date-fns";
import { id as localeId } from "date-fns/locale";

export type RegistrationDayPoint = {
  /** yyyy-MM-dd */
  date: string;
  /** Short label for axis, e.g. 26 Jul */
  label: string;
  count: number;
};

/** Build a contiguous daily series (default 30 days, inclusive). */
export function buildMemberRegistrationSeries(
  createdAts: Date[],
  days = 30,
  now = new Date(),
): RegistrationDayPoint[] {
  const end = startOfDay(now);
  const start = subDays(end, days - 1);
  const counts = new Map<string, number>();

  for (const d of eachDayOfInterval({ start, end })) {
    counts.set(format(d, "yyyy-MM-dd"), 0);
  }

  for (const createdAt of createdAts) {
    const key = format(startOfDay(createdAt), "yyyy-MM-dd");
    if (!counts.has(key)) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()].map(([date, count]) => ({
    date,
    label: format(new Date(`${date}T12:00:00`), "d MMM", { locale: localeId }),
    count,
  }));
}
