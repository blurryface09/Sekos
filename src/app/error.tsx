"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="shell" style={{ maxWidth: 480, paddingBlock: "16vh 40px" }}>
      <p className="label">Something broke</p>
      <h1 style={{ fontSize: 36, marginTop: 12 }}>That did not work</h1>
      <p style={{ color: "var(--ink-2)", marginTop: 12 }}>
        Nothing you did caused this and nothing was lost. Try again, and if it
        keeps happening the reference below says what went wrong.
      </p>
      <div className="panelfoot">
        <button className="btn solid" type="button" onClick={reset}>
          Try again
        </button>
        <a className="btn" href="/us">
          Back to our plans
        </a>
      </div>
      {error.digest ? (
        <p className="hint" style={{ marginTop: 20 }}>
          Reference {error.digest}
        </p>
      ) : null}
    </main>
  );
}
