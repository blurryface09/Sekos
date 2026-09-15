import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { sha256, urlSecret } from "@/lib/random";

const COOKIE = "sekos_session";
const SESSION_DAYS = 90;
const LINK_MINUTES = 20;

function key(): Uint8Array {
  return new TextEncoder().encode(env.authSecret);
}

export async function startSession(userId: string): Promise<void> {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function currentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key());
    if (typeof payload.sub !== "string") return null;
    return await prisma.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}

/**
 * Mints a single use login link. Only the hash is stored, so a leaked database
 * row cannot be replayed as a login.
 */
export async function createLoginLink(email: string): Promise<string> {
  const normalised = email.trim().toLowerCase();

  const user = await prisma.user.upsert({
    where: { email: normalised },
    update: {},
    create: { email: normalised },
  });

  const token = urlSecret(32);
  await prisma.loginToken.create({
    data: {
      tokenHash: sha256(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + LINK_MINUTES * 60 * 1000),
    },
  });

  return `${env.appUrl}/auth/verify?token=${token}`;
}

export async function consumeLoginToken(token: string): Promise<string | null> {
  const row = await prisma.loginToken.findUnique({
    where: { tokenHash: sha256(token) },
  });

  if (!row || row.usedAt || row.expiresAt < new Date()) return null;

  await prisma.loginToken.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });

  return row.userId;
}
