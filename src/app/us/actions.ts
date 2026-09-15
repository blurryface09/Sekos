"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { endSession } from "@/lib/auth";
import { requireSpace, assertPlanInSpace } from "@/lib/space";
import { dayFromInput, addDays } from "@/lib/dates";
import { presignUpload, storageConfigured } from "@/lib/storage";
import { sendInvite } from "@/lib/email";
import { env } from "@/lib/env";

async function context() {
  const found = await requireSpace();
  if (!found) redirect("/login");
  return found;
}

function refresh() {
  revalidatePath("/us");
}

export async function createPlan(formData: FormData): Promise<void> {
  const { space, user } = await context();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const lines = String(formData.get("items") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const remind = String(formData.get("remindDaysBefore") ?? "1");

  await prisma.plan.create({
    data: {
      spaceId: space.id,
      createdById: user.id,
      title,
      place: String(formData.get("place") ?? "").trim() || null,
      date: dayFromInput(String(formData.get("date") ?? "")),
      startTime: String(formData.get("startTime") ?? "").trim() || null,
      note: String(formData.get("note") ?? "").trim() || null,
      remindDaysBefore: remind === "off" ? null : Number(remind),
      items: {
        create: lines.map((text, position) => ({ text, position })),
      },
    },
  });

  refresh();
}

export async function updatePlan(formData: FormData): Promise<void> {
  const { space } = await context();
  const id = String(formData.get("id") ?? "");
  await assertPlanInSpace(id, space.id);

  const remind = String(formData.get("remindDaysBefore") ?? "1");

  await prisma.plan.update({
    where: { id },
    data: {
      title: String(formData.get("title") ?? "").trim(),
      place: String(formData.get("place") ?? "").trim() || null,
      date: dayFromInput(String(formData.get("date") ?? "")),
      startTime: String(formData.get("startTime") ?? "").trim() || null,
      note: String(formData.get("note") ?? "").trim() || null,
      remindDaysBefore: remind === "off" ? null : Number(remind),
    },
  });

  refresh();
}

export async function deletePlan(formData: FormData): Promise<void> {
  const { space } = await context();
  const id = String(formData.get("id") ?? "");
  await assertPlanInSpace(id, space.id);
  await prisma.plan.delete({ where: { id } });
  refresh();
}

export async function setStatus(formData: FormData): Promise<void> {
  const { space } = await context();
  const id = String(formData.get("id") ?? "");
  await assertPlanInSpace(id, space.id);

  const status = String(formData.get("status") ?? "PLANNED");
  if (status !== "PLANNED" && status !== "DONE" && status !== "SKIPPED") return;

  await prisma.plan.update({ where: { id }, data: { status } });
  refresh();
}

/**
 * Moves a plan to a new day and keeps the old one, so a plan that keeps
 * slipping shows that it has been slipping.
 */
export async function reschedule(formData: FormData): Promise<void> {
  const { space } = await context();
  const id = String(formData.get("id") ?? "");
  await assertPlanInSpace(id, space.id);

  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) return;

  const preset = String(formData.get("preset") ?? "");
  let next: Date | null = null;

  if (preset === "week" && plan.date) next = addDays(plan.date, 7);
  else if (preset === "fortnight" && plan.date) next = addDays(plan.date, 14);
  else if (preset === "someday") next = null;
  else next = dayFromInput(String(formData.get("date") ?? ""));

  if (preset !== "someday" && !next) return;

  await prisma.plan.update({
    where: { id },
    data: {
      date: next,
      status: "PLANNED",
      previousDates: plan.date
        ? { set: [...plan.previousDates, plan.date] }
        : undefined,
      // A moved plan deserves a fresh reminder.
      reminders: { deleteMany: {} },
    },
  });

  refresh();
}

export async function addItem(formData: FormData): Promise<void> {
  const { space } = await context();
  const planId = String(formData.get("planId") ?? "");
  await assertPlanInSpace(planId, space.id);

  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;

  const count = await prisma.checklistItem.count({ where: { planId } });
  await prisma.checklistItem.create({
    data: { planId, text, position: count },
  });

  refresh();
}

export async function toggleItem(formData: FormData): Promise<void> {
  const { space } = await context();
  const id = String(formData.get("id") ?? "");

  const item = await prisma.checklistItem.findUnique({
    where: { id },
    include: { plan: { select: { spaceId: true } } },
  });
  if (!item || item.plan.spaceId !== space.id) return;

  await prisma.checklistItem.update({
    where: { id },
    data: { done: !item.done },
  });

  refresh();
}

export async function deleteItem(formData: FormData): Promise<void> {
  const { space } = await context();
  const id = String(formData.get("id") ?? "");

  const item = await prisma.checklistItem.findUnique({
    where: { id },
    include: { plan: { select: { spaceId: true } } },
  });
  if (!item || item.plan.spaceId !== space.id) return;

  await prisma.checklistItem.delete({ where: { id } });
  refresh();
}

export async function saveEntry(formData: FormData): Promise<void> {
  const { space, user } = await context();
  const planId = String(formData.get("planId") ?? "");
  await assertPlanInSpace(planId, space.id);

  const body = String(formData.get("body") ?? "").trim();

  if (!body) {
    await prisma.diaryEntry.deleteMany({ where: { planId } });
  } else {
    await prisma.diaryEntry.upsert({
      where: { planId },
      update: { body, writtenById: user.id },
      create: { planId, body, writtenById: user.id },
    });
    await prisma.plan.update({
      where: { id: planId },
      data: { status: "DONE" },
    });
  }

  refresh();
}

/** Called by the browser before it uploads a photo straight to the bucket. */
export async function signPhotoUpload(
  planId: string,
  contentType: string,
): Promise<{ uploadUrl: string; key: string; url: string } | { error: string }> {
  const { space } = await context();
  await assertPlanInSpace(planId, space.id);

  if (!storageConfigured()) {
    return { error: "Photo storage is not set up yet." };
  }

  try {
    return await presignUpload({ spaceId: space.id, planId, contentType });
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function attachPhoto(
  planId: string,
  key: string,
  url: string,
): Promise<void> {
  const { space, user } = await context();
  await assertPlanInSpace(planId, space.id);

  await prisma.photo.create({
    data: { planId, key, url, uploadedById: user.id },
  });

  refresh();
}

export async function deletePhoto(formData: FormData): Promise<void> {
  const { space } = await context();
  const id = String(formData.get("id") ?? "");

  const photo = await prisma.photo.findUnique({
    where: { id },
    include: { plan: { select: { spaceId: true } } },
  });
  if (!photo || photo.plan.spaceId !== space.id) return;

  await prisma.photo.delete({ where: { id } });
  refresh();
}

export async function saveNames(formData: FormData): Promise<void> {
  const { user, space } = await context();

  const name = String(formData.get("name") ?? "").trim();
  if (name) await prisma.user.update({ where: { id: user.id }, data: { name } });

  const spaceName = String(formData.get("spaceName") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();

  await prisma.space.update({
    where: { id: space.id },
    data: {
      name: spaceName || space.name,
      timezone: timezone || space.timezone,
    },
  });

  refresh();
}

export async function invitePartner(formData: FormData): Promise<void> {
  const { user, space } = await context();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;

  await sendInvite({
    to: email,
    fromName: user.name ?? user.email.split("@")[0],
    url: `${env.appUrl}/join/${space.inviteCode}`,
  });

  refresh();
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect("/login");
}
