import type { Plan, ChecklistItem } from "@/generated/prisma";

type FeedPlan = Plan & { items: ChecklistItem[] };

function escape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Folds long lines at 75 octets, which strict calendar clients require. */
function fold(line: string): string {
  if (line.length <= 73) return line;
  const chunks: string[] = [];
  let rest = line;
  chunks.push(rest.slice(0, 73));
  rest = rest.slice(73);
  while (rest.length > 72) {
    chunks.push(" " + rest.slice(0, 72));
    rest = rest.slice(72);
  }
  if (rest.length) chunks.push(" " + rest);
  return chunks.join("\r\n");
}

function stampUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function localStamp(date: Date, time: string): string {
  const [h, m] = time.split(":");
  return `${dateOnly(date)}T${h.padStart(2, "0")}${(m ?? "00").padStart(2, "0")}00`;
}

function describe(plan: FeedPlan): string {
  const lines: string[] = [];
  if (plan.note) lines.push(plan.note, "");
  const pending = plan.items.filter((item) => !item.done);
  if (pending.length) {
    lines.push("Still to sort:");
    for (const item of pending) lines.push(`- ${item.text}`);
  }
  return lines.join("\n").trim();
}

export function buildFeed(options: {
  name: string;
  timezone: string;
  plans: FeedPlan[];
}): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sekos//Itinerary//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escape(options.name)}`,
    `X-WR-TIMEZONE:${escape(options.timezone)}`,
    // Ask clients to re-poll roughly every hour rather than once a day.
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];

  for (const plan of options.plans) {
    if (!plan.date) continue;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${plan.id}@sekos`);
    lines.push(`DTSTAMP:${stampUtc(plan.updatedAt ?? new Date())}`);

    if (plan.startTime) {
      const end = new Date(plan.date);
      lines.push(`DTSTART;TZID=${options.timezone}:${localStamp(plan.date, plan.startTime)}`);
      const [h, m] = plan.startTime.split(":").map(Number);
      const endHour = String(Math.min(h + 2, 23)).padStart(2, "0");
      lines.push(
        `DTEND;TZID=${options.timezone}:${localStamp(end, `${endHour}:${String(m ?? 0).padStart(2, "0")}`)}`,
      );
    } else {
      lines.push(`DTSTART;VALUE=DATE:${dateOnly(plan.date)}`);
      lines.push(
        `DTEND;VALUE=DATE:${dateOnly(new Date(plan.date.getTime() + 86400000))}`,
      );
    }

    lines.push(`SUMMARY:${escape(plan.title)}`);
    if (plan.place) lines.push(`LOCATION:${escape(plan.place)}`);

    const description = describe(plan);
    if (description) lines.push(`DESCRIPTION:${escape(description)}`);
    if (plan.status === "DONE") lines.push("STATUS:CONFIRMED");

    if (plan.remindDaysBefore !== null) {
      lines.push("BEGIN:VALARM");
      lines.push("ACTION:DISPLAY");
      lines.push(
        plan.remindDaysBefore === 0
          ? "TRIGGER:-PT2H"
          : `TRIGGER:-P${plan.remindDaysBefore}D`,
      );
      lines.push(`DESCRIPTION:${escape(plan.title)}`);
      lines.push("END:VALARM");
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
