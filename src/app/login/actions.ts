"use server";

import { createLoginLink } from "@/lib/auth";
import { sendLoginLink } from "@/lib/email";

export type LoginState = { message: string; sent: boolean };

export async function requestLink(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { message: "That does not look like an email address.", sent: false };
  }

  try {
    const url = await createLoginLink(email);
    await sendLoginLink(email, url);
    if (process.env.NODE_ENV === "development") console.log(`[login] ${url}`);
    return { message: `Sent. Check ${email}.`, sent: true };
  } catch (error) {
    console.error(error);
    return {
      message: "The email would not send. Try again in a moment.",
      sent: false,
    };
  }
}
