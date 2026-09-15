import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { sendReminder } from "@/lib/email";
import { todayIn, daysBetween, formatDay, formatTime } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Runs daily from Vercel Cron. Sends one email per plan per lead time, and
 * records what it sent so a second run in the same day stays quiet.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.cronSecret}`) {
    return new Response("No", { status: 401 });
  }

  const spaces = await prisma.space.findMany({
    include: {
      members: { include: { user: true } },
      plans: {
        where: { status: "PLANNED", date: { not: null } },
        include: { items: true, reminders: true },
      },
    },
  });

  let sent = 0;
  const failures: string[] = [];

  for (const space of spaces) {
    const today = todayIn(space.timezone);

    for (const plan of space.plans) {
      if (!plan.date || plan.remindDaysBefore === null) continue;

      const away = daysBetween(today, plan.date);
      if (away !== plan.remindDaysBefore) continue;

      const kind = `lead-${plan.remindDaysBefore}`;
      if (plan.reminders.some((reminder) => reminder.kind === kind)) continue;

      const when =
        away === 0
          ? `Today, ${formatTime(plan.startTime)}`
          : `${formatDay(plan.date, space.timezone)}, ${formatTime(plan.startTime)}`;

      const pending = plan.items.filter((item) => !item.done).map((item) => item.text);
      const leadLabel =
        away === 0 ? "Today" : away === 1 ? "Tomorrow" : `In ${away} days`;

      try {
        for (const member of space.members) {
          await sendReminder({
            to: member.user.email,
            title: plan.title,
            when,
            place: plan.place,
            pending,
            url: `${env.appUrl}/us`,
            leadLabel,
          });
        }

        await prisma.reminderSent.create({ data: { planId: plan.id, kind } });
        sent += space.members.length;
      } catch (error) {
        failures.push(`${plan.id}: ${(error as Error).message}`);
      }
    }
  }

  return Response.json({ sent, failures });
}
