"use client";

import { useState } from "react";
import { reschedule } from "@/app/us/actions";

export function Reschedule({ id, hasDate }: { id: string; hasDate: boolean }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" className="btn" onClick={() => setOpen(true)}>
        Move it
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {hasDate ? (
        <>
          <form action={reschedule}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="preset" value="week" />
            <button className="btn" type="submit">A week later</button>
          </form>
          <form action={reschedule}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="preset" value="fortnight" />
            <button className="btn" type="submit">Two weeks</button>
          </form>
        </>
      ) : null}

      <form action={reschedule} style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="preset" value="pick" />
        <input
          type="date"
          name="date"
          aria-label="New day"
          style={{ width: "auto", fontSize: 13, padding: "6px 8px" }}
        />
        <button className="btn solid" type="submit">Move</button>
      </form>

      <form action={reschedule}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="preset" value="someday" />
        <button className="btn quiet" type="submit">Someday</button>
      </form>

      <button type="button" className="btn quiet" onClick={() => setOpen(false)}>
        Never mind
      </button>
    </div>
  );
}
