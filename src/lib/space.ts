import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { readableCode, urlSecret } from "@/lib/random";

/** The signed in user plus the space they share. Creates one on first sign in. */
export async function requireSpace() {
  const user = await currentUser();
  if (!user) return null;

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { space: { include: { members: { include: { user: true } } } } },
    orderBy: { joinedAt: "asc" },
  });

  if (membership) return { user, space: membership.space };

  const space = await prisma.space.create({
    data: {
      feedSecret: urlSecret(24),
      inviteCode: readableCode(8),
      members: { create: { userId: user.id } },
    },
    include: { members: { include: { user: true } } },
  });

  return { user, space };
}

export async function assertPlanInSpace(planId: string, spaceId: string) {
  const plan = await prisma.plan.findFirst({
    where: { id: planId, spaceId },
    select: { id: true },
  });
  if (!plan) throw new Error("That plan is not yours to change.");
  return plan;
}

export function partnerName(
  space: { members: { user: { name: string | null; email: string } }[] },
  meEmail: string,
): string | null {
  const other = space.members.find((m) => m.user.email !== meEmail);
  if (!other) return null;
  return other.user.name ?? other.user.email.split("@")[0];
}
