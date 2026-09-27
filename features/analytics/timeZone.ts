const ANALYTICS_TIME_ZONE = "America/New_York";

export function newYorkDayStart(date: Date, daysBefore = 0) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ANALYTICS_TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const calendarDate = new Date(Date.UTC(get("year"), get("month") - 1, get("day") - daysBefore));
  const year = calendarDate.getUTCFullYear();
  const month = calendarDate.getUTCMonth();
  const day = calendarDate.getUTCDate();
  // 03:00 UTC precedes New York midnight, including on daylight-saving change days.
  const beforeMidnight = new Date(Date.UTC(year, month, day, 3));
  const hour = Number(new Intl.DateTimeFormat("en-US", {
    timeZone: ANALYTICS_TIME_ZONE, hour: "2-digit", hourCycle: "h23",
  }).format(beforeMidnight));
  const offsetHours = (3 - hour + 24) % 24;
  return new Date(Date.UTC(year, month, day, offsetHours)).toISOString();
}
