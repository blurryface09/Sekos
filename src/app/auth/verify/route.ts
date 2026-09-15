import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { consumeLoginToken, startSession } from "@/lib/auth";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.redirect(`${env.appUrl}/login`);

  const userId = await consumeLoginToken(token);
  if (!userId) {
    return NextResponse.redirect(`${env.appUrl}/login?expired=1`);
  }

  await startSession(userId);

  const jar = await cookies();
  const invite = jar.get("sekos_invite")?.value;
  if (invite) {
    jar.delete("sekos_invite");
    return NextResponse.redirect(`${env.appUrl}/join/${invite}`);
  }

  return NextResponse.redirect(`${env.appUrl}/us`);
}
