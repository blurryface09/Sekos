function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

export const env = {
  get authSecret() {
    return required("AUTH_SECRET");
  },
  get appUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
      /\/$/,
      "",
    );
  },
  get resendKey() {
    return process.env.RESEND_API_KEY ?? "";
  },
  get emailFrom() {
    return process.env.EMAIL_FROM ?? "Sekos <onboarding@resend.dev>";
  },
  get cronSecret() {
    return required("CRON_SECRET");
  },
};
