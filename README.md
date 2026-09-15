# Sekos

Products by Samuel Seko.

## Somewhere With You

A shared itinerary and diary for two people. Plans you keep meaning to make,
the small lists that go with them, and afterwards, photos and a note about what
it was actually like.

- **Plans** with a day, a time, a place and a private note.
- **Checklists** per plan. Either of you ticks, both of you see it.
- **Slipped past** catches anything whose day came and went, with one tap to
  move it a week, a fortnight, a chosen day, or back to someday. A plan that
  keeps slipping says so on its face.
- **Diary** for the ones you kept. Photos and what happened.
- **Calendar feed** so the plans land in the phone calendar app on their own,
  alarms attached, and show up in the calendar widget on the home screen.
- **Email reminders** on your chosen lead time, sent once a day.
- **Installable** to the home screen as a web app on both iOS and Android.

### Why a calendar feed rather than a widget

A home screen widget on iPhone requires a native app on the App Store, which
requires the Apple Developer Program. A subscribed calendar feed gets the same
result through the calendar widget Apple already ships, costs nothing, and
needs no review. The feed URL contains a secret and should be treated as a
password.

## Running it

```bash
cp .env.example .env    # then fill it in
npm install
npm run db:push         # creates the tables
npm run dev
```

`AUTH_SECRET` and `CRON_SECRET` can each be generated with
`openssl rand -base64 32`.

### Email

Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` and mail goes out through Gmail. This
is the right choice until you own a domain, because it delivers to anybody.
Switch on two factor authentication on the Google account, then generate an app
password at myaccount.google.com/apppasswords.

`RESEND_API_KEY` is used only when the Gmail pair is absent. Resend will not
deliver to anyone except your own address until a sending domain is verified,
so it is the wrong default for an app where two people both need to sign in.

With neither set, mail is logged to the server console instead of sent, which
is enough for local work.

Photos need an S3 compatible bucket. Cloudflare R2 is the cheapest sensible
option. Leave the S3 variables blank and everything else still works, the
photo button just reports that storage is not set up.

## Deploying

Vercel. Set the same environment variables in the project settings, point
`NEXT_PUBLIC_APP_URL` at the real domain, and run `npm run db:push` once
against the production database. `vercel.json` already schedules the daily
reminder job for 07:00 UTC.

Any Postgres works. Neon and Supabase both have free tiers.

## Shape of the code

```
prisma/schema.prisma     users, spaces, plans, checklists, photos, diary entries
src/lib/auth.ts          magic link sign in, no passwords
src/lib/ics.ts           the calendar feed
src/lib/storage.ts       presigned photo uploads, straight to the bucket
src/app/us/              the app itself, one page and its server actions
src/app/api/cal/         the subscribed feed
src/app/api/cron/        the daily reminder job
```

A space holds two people today but is modelled as a group, so friends and
family fit later without a migration.

## Not built yet

- Push notifications. Needs a service worker and VAPID keys.
- A native app and a real widget. Both wait on a developer account, and both
  sit on this same database when the time comes.
