import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSpace, partnerName } from "@/lib/space";
import { env } from "@/lib/env";
import { todayIn, daysBetween, dayToInput, formatTime } from "@/lib/dates";
import { PlanCard, type PlanView } from "@/components/PlanCard";
import { NewPlanButton } from "@/components/NewPlanButton";
import { Settings } from "@/components/Settings";

export const dynamic = "force-dynamic";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function UsPage() {
  const found = await requireSpace();
  if (!found) redirect("/login");
  const { user, space } = found;

  const plans = await prisma.plan.findMany({
    where: { spaceId: space.id },
    include: {
      items: { orderBy: { position: "asc" } },
      photos: { orderBy: { createdAt: "asc" } },
      entry: { include: { writtenBy: true } },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  const today = todayIn(space.timezone);

  const views: PlanView[] = plans.map((plan) => ({
    id: plan.id,
    title: plan.title,
    place: plan.place,
    note: plan.note,
    status: plan.status,
    remindDaysBefore: plan.remindDaysBefore,
    dateInput: dayToInput(plan.date),
    startTime: plan.startTime,
    month: plan.date ? MONTHS[plan.date.getUTCMonth()] : null,
    dayNumber: plan.date ? String(plan.date.getUTCDate()) : null,
    weekday: plan.date ? WEEKDAYS[plan.date.getUTCDay()] : null,
    timeLabel: formatTime(plan.startTime),
    daysAway: plan.date ? daysBetween(today, plan.date) : null,
    movedCount: plan.previousDates.length,
    items: plan.items.map((item) => ({ id: item.id, text: item.text, done: item.done })),
    photos: plan.photos.map((photo) => ({ id: photo.id, url: photo.url })),
    entry: plan.entry
      ? {
          body: plan.entry.body,
          by: plan.entry.writtenBy?.name ?? null,
        }
      : null,
  }));

  const kept = views.filter((plan) => plan.status === "DONE");
  const missed = views.filter(
    (plan) => plan.status === "PLANNED" && plan.daysAway !== null && plan.daysAway < 0,
  );
  const ahead = views.filter(
    (plan) =>
      plan.status === "PLANNED" && (plan.daysAway === null || plan.daysAway >= 0),
  );

  const next = ahead.find((plan) => plan.daysAway !== null) ?? null;
  const allItems = views.flatMap((plan) => plan.items);
  const ticked = allItems.filter((item) => item.done).length;

  const partner = partnerName(space, user.email);
  const feedUrl = `${env.appUrl}/api/cal/${space.feedSecret}/calendar.ics`;
  const inviteUrl = `${env.appUrl}/join/${space.inviteCode}`;

  return (
    <main className="shell">
      <header className="masthead">
        <p className="label">{space.name}</p>
        <h1>
          Somewhere <em>with</em> you
        </h1>
        <p style={{ color: "var(--ink-2)", margin: 0, fontSize: 15 }}>
          {partner
            ? `${user.name ?? "You"} and ${partner}.`
            : "Just you so far. Bring her in from settings."}
        </p>

        <div className="stats">
          <div className="stat">
            <b>{views.length}</b>
            <span className="label">plans</span>
          </div>
          <div className="stat">
            <b>{kept.length}</b>
            <span className="label">we went</span>
          </div>
          <div className="stat">
            <b>
              {ticked}/{allItems.length}
            </b>
            <span className="label">sorted</span>
          </div>
          <div className="stat">
            <b>{next?.daysAway ?? "—"}</b>
            <span className="label">days to next</span>
          </div>
        </div>
      </header>

      {next ? (
        <section className="nextup">
          <div className="count">
            {next.daysAway === 0 ? "today" : next.daysAway}
            <small>
              {next.daysAway === 0
                ? "it is happening"
                : next.daysAway === 1
                  ? "day away"
                  : "days away"}
            </small>
          </div>
          <div className="what">
            <h2>{next.title}</h2>
            <p>
              {[
                next.place,
                next.month ? `${next.weekday} ${next.dayNumber} ${next.month}` : null,
                next.timeLabel === "all day" ? null : next.timeLabel,
                next.items.filter((item) => !item.done).length
                  ? `${next.items.filter((item) => !item.done).length} still to sort`
                  : null,
              ]
                .filter(Boolean)
                .join("  ·  ")}
            </p>
          </div>
        </section>
      ) : null}

      <div className="sechead">
        <h2 className="label" style={{ fontFamily: "var(--label)" }}>
          Coming up
        </h2>
        <div className="rule" />
        <NewPlanButton />
      </div>

      {ahead.length ? (
        <div className="stack">
          {ahead.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <p style={{ margin: 0, color: "var(--ink-2)" }}>
            Nothing ahead of you yet. Add the first one, even if the date is a
            guess. A plan with a bad date beats a plan you keep meaning to make.
          </p>
        </div>
      )}

      {missed.length ? (
        <>
          <div className="sechead">
            <h2 className="label" style={{ fontFamily: "var(--label)" }}>
              Slipped past
            </h2>
            <div className="rule" />
          </div>
          <div className="stack">
            {missed.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </>
      ) : null}

      {kept.length ? (
        <>
          <div className="sechead">
            <h2 className="label" style={{ fontFamily: "var(--label)" }}>
              Where we have been
            </h2>
            <div className="rule" />
          </div>
          <div className="stack">
            {kept
              .slice()
              .reverse()
              .map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
          </div>
        </>
      ) : null}

      <div style={{ marginTop: 56, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
        <Settings
          myName={user.name ?? ""}
          spaceName={space.name}
          timezone={space.timezone}
          feedUrl={feedUrl}
          inviteUrl={inviteUrl}
          partner={partner}
        />
      </div>
    </main>
  );
}
