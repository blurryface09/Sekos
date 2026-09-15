import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { sendJoined } from "@/lib/email";
import { env } from "@/lib/env";

/**
 * Joining is deliberately a link rather than a code to type. Signed out, it
 * remembers where you were headed and sends you to sign in first.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const space = await prisma.space.findUnique({ where: { inviteCode: code } });
  if (!space) return NextResponse.redirect(`${env.appUrl}/us`);

  const user = await currentUser();
  if (!user) {
    const response = NextResponse.redirect(`${env.appUrl}/login`);
    response.cookies.set("sekos_invite", code, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  }

  const members = await prisma.membership.count({ where: { spaceId: space.id } });
  if (members >= 2) {
    const already = await prisma.membership.findUnique({
      where: { userId_spaceId: { userId: user.id, spaceId: space.id } },
    });
    if (!already) return NextResponse.redirect(`${env.appUrl}/us?full=1`);
  }

  const alreadyIn = await prisma.membership.findUnique({
    where: { userId_spaceId: { userId: user.id, spaceId: space.id } },
  });

  await prisma.membership.upsert({
    where: { userId_spaceId: { userId: user.id, spaceId: space.id } },
    update: {},
    create: { userId: user.id, spaceId: space.id },
  });

  // Tell whoever was already here, but only the first time, and never let a
  // failed send stop someone getting in.
  if (!alreadyIn) {
    const others = await prisma.membership.findMany({
      where: { spaceId: space.id, userId: { not: user.id } },
      include: { user: true },
    });

    const who = user.name ?? user.email.split("@")[0];
    for (const member of others) {
      try {
        await sendJoined({
          to: member.user.email,
          who,
          url: `${env.appUrl}/us`,
        });
      } catch (error) {
        console.error("join notice failed", error);
      }
    }
  }

  // A person who made an empty space of their own before joining does not need it.
  const mine = await prisma.membership.findMany({
    where: { userId: user.id, spaceId: { not: space.id } },
    include: { space: { include: { plans: true, members: true } } },
  });
  for (const membership of mine) {
    if (
      membership.space.plans.length === 0 &&
      membership.space.members.length === 1
    ) {
      await prisma.space.delete({ where: { id: membership.spaceId } });
    }
  }

  return NextResponse.redirect(`${env.appUrl}/us`);
}
