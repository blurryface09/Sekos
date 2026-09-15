"use client";

import { useState, useActionState } from "react";
import {
  saveNames,
  invitePartner,
  signOut,
  type InviteState,
} from "@/app/us/actions";

const noInviteYet: InviteState = { message: "", ok: false };

export function Settings({
  myName,
  spaceName,
  timezone,
  feedUrl,
  inviteUrl,
  partner,
}: {
  myName: string;
  spaceName: string;
  timezone: string;
  feedUrl: string;
  inviteUrl: string;
  partner: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const [invite, sendInvite, inviting] = useActionState(invitePartner, noInviteYet);

  async function copy(value: string, which: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied("");
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn quiet" onClick={() => setOpen(true)}>
        Settings
      </button>
    );
  }

  return (
    <div className="sheet" style={{ marginTop: 20 }}>
      <h3 style={{ fontSize: 20, marginBottom: 6 }}>Settings</h3>
      <p className="hint" style={{ marginTop: 0, marginBottom: 20 }}>
        Names, reminders and the calendar feed.
      </p>

      <form action={saveNames} className="grid">
        <label className="field">
          <span>Your name</span>
          <input name="name" defaultValue={myName} maxLength={40} placeholder="Samuel" />
        </label>
        <label className="field">
          <span>What to call this</span>
          <input name="spaceName" defaultValue={spaceName} maxLength={40} placeholder="Us" />
        </label>
        <label className="field">
          <span>Timezone</span>
          <input name="timezone" defaultValue={timezone} placeholder="Africa/Lagos" />
        </label>
        <div className="full">
          <button className="btn solid" type="submit">Save</button>
        </div>
      </form>

      <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "24px 0" }} />

      <h4 style={{ fontSize: 16, marginBottom: 8 }}>Put this in your calendars</h4>
      <p className="hint" style={{ marginTop: 0 }}>
        Subscribe once, on each phone. Every plan then shows up in the calendar
        app on its own, alarms included, and appears in the calendar widget on
        your home screen. Do not import it as a file, subscribe to it, otherwise
        it stops updating.
      </p>
      <div className="mono-box" style={{ marginTop: 10 }}>{feedUrl}</div>
      <div className="sheetfoot">
        <button type="button" className="btn" onClick={() => copy(feedUrl, "feed")}>
          {copied === "feed" ? "Copied" : "Copy the link"}
        </button>
        <a className="btn" href={feedUrl.replace(/^https?:/, "webcal:")}>
          Subscribe on this device
        </a>
      </div>
      <p className="hint" style={{ marginTop: 10 }}>
        Treat that link like a key. Anyone holding it can read your plans.
      </p>

      <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "24px 0" }} />

      <h4 style={{ fontSize: 16, marginBottom: 8 }}>
        {partner ? `${partner} is in` : "Bring her in"}
      </h4>
      {partner ? (
        <p className="hint" style={{ marginTop: 0 }}>
          You both see the same plans, the same ticks and the same diary.
        </p>
      ) : (
        <>
          <form action={sendInvite} className="grid" style={{ marginBottom: 12 }}>
            <label className="field">
              <span>Send the invite to</span>
              <input
                id="invite-email"
                name="email"
                type="email"
                placeholder="her@example.com"
              />
            </label>
            <div className="field" style={{ justifyContent: "flex-end" }}>
              <button className="btn solid" type="submit" disabled={inviting}>
                {inviting ? "Sending" : "Send it"}
              </button>
            </div>
          </form>

          {invite.message ? (
            <p
              className="hint"
              style={{
                marginTop: 0,
                marginBottom: 12,
                color: invite.ok ? "var(--rose-deep)" : "var(--ink-2)",
              }}
            >
              {invite.message}
            </p>
          ) : null}
          <div className="mono-box">{inviteUrl}</div>
          <div className="sheetfoot">
            <button type="button" className="btn" onClick={() => copy(inviteUrl, "invite")}>
              {copied === "invite" ? "Copied" : "Copy the invite link"}
            </button>
          </div>
        </>
      )}

      <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "24px 0" }} />

      <div className="sheetfoot">
        <button type="button" className="btn" onClick={() => setOpen(false)}>
          Close
        </button>
        <span className="spacer" />
        <form action={signOut}>
          <button className="btn quiet" type="submit">Sign out</button>
        </form>
      </div>
    </div>
  );
}
