"use client";

import { useActionState } from "react";
import { requestLink, type LoginState } from "./actions";

const initial: LoginState = { message: "", sent: false };

export default function LoginPage() {
  const [state, action, pending] = useActionState(requestLink, initial);

  return (
    <main className="shell" style={{ maxWidth: 440, paddingBlock: "18vh 40px" }}>
      <p className="label">Sekos</p>
      <h1 style={{ fontSize: 44, lineHeight: 1.02, marginTop: 14 }}>
        Somewhere{" "}
        <span style={{ fontStyle: "italic", fontWeight: 400, color: "var(--rose)" }}>
          with
        </span>{" "}
        you
      </h1>
      <p style={{ color: "var(--ink-2)", marginTop: 14, marginBottom: 32 }}>
        The places you keep saying you should go, and what happened when you
        finally went.
      </p>

      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <label className="field">
          <span>Your email</span>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <button className="btn solid" type="submit" disabled={pending} style={{ justifyContent: "center", padding: "12px 18px" }}>
          {pending ? "Sending" : "Send me a link"}
        </button>
      </form>

      {state.message ? (
        <p
          style={{
            marginTop: 18,
            fontSize: 14,
            color: state.sent ? "var(--rose-deep)" : "var(--ink-2)",
          }}
        >
          {state.message}
        </p>
      ) : null}

      <p style={{ marginTop: 40, fontSize: 13, color: "var(--ink-3)" }}>
        No password to forget. The link signs you in and then stops working.
      </p>
    </main>
  );
}
