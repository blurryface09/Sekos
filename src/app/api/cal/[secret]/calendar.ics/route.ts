import { prisma } from "@/lib/prisma";
import { buildFeed } from "@/lib/ics";

export const dynamic = "force-dynamic";

/**
 * The private calendar feed. Phones poll this on their own schedule once the
 * person subscribes, which is what keeps plans on their home screen without
 * anyone opening the app.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ secret: string }> },
) {
  const { secret } = await params;

  const space = await prisma.space.findUnique({
    where: { feedSecret: secret },
    include: {
      plans: {
        where: { date: { not: null } },
        include: { items: { orderBy: { position: "asc" } } },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!space) {
    return new Response("Not found", { status: 404 });
  }

  const body = buildFeed({
    name: space.name === "Us" ? "Somewhere With You" : space.name,
    timezone: space.timezone,
    plans: space.plans,
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="somewhere-with-you.ics"',
      "Cache-Control": "no-store",
    },
  });
}
