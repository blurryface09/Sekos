"use client";

import { useState } from "react";
import { createPlan, updatePlan } from "@/app/us/actions";

type Existing = {
  id: string;
  title: string;
  place: string | null;
  date: string;
  startTime: string | null;
  note: string | null;
  remindDaysBefore: number | null;
  items: string;
};

const REMINDERS: [string, string][] = [
  ["0", "the morning of"],
  ["1", "a day before"],
  ["2", "two days before"],
  ["7", "a week before"],
  ["off", "no reminder"],
];

export function PlanForm({
  existing,
  onDone,
}: {
  existing?: Existing;
  onDone?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const editing = Boolean(existing);

  return (
    <form
      className="panel"
      action={async (formData) => {
        setBusy(true);
        try {
          if (editing) await updatePlan(formData);
          else await createPlan(formData);
          onDone?.();
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3 style={{ fontSize: 24, marginBottom: 18 }}>
        {editing ? "Edit" : "Somewhere new"}
      </h3>

      {existing ? <input type="hidden" name="id" value={existing.id} /> : null}

      <div className="cols">
        <label className="field wide">
          <span>What is it</span>
          <input
            name="title"
            required
            maxLength={120}
            defaultValue={existing?.title ?? ""}
            placeholder="Dinner somewhere new"
          />
        </label>

        <label className="field wide">
          <span>Where</span>
          <input
            name="place"
            maxLength={160}
            defaultValue={existing?.place ?? ""}
            placeholder="The place"
          />
        </label>

        <label className="field">
          <span>Day</span>
          <input type="date" name="date" defaultValue={existing?.date ?? ""} />
        </label>

        <label className="field">
          <span>Time, if you know it</span>
          <input
            type="time"
            name="startTime"
            defaultValue={existing?.startTime ?? ""}
          />
        </label>

        <label className="field">
          <span>Remind us</span>
          <select
            name="remindDaysBefore"
            defaultValue={
              existing
                ? existing.remindDaysBefore === null
                  ? "off"
                  : String(existing.remindDaysBefore)
                : "1"
            }
          >
            {REMINDERS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="field wide">
          <span>Note</span>
          <textarea
            name="note"
            maxLength={600}
            defaultValue={existing?.note ?? ""}
            placeholder="Anything worth remembering about it"
          />
        </label>

        {editing ? null : (
          <label className="field wide">
            <span>Things to sort, one per line</span>
            <textarea
              name="items"
              placeholder={"book it\nsort transport"}
            />
          </label>
        )}
      </div>

      <div className="panelfoot">
        <button className="btn solid" type="submit" disabled={busy}>
          {busy ? "Saving" : editing ? "Save changes" : "Add it"}
        </button>
        {onDone ? (
          <button type="button" className="btn" onClick={onDone}>
            Cancel
          </button>
        ) : null}
        <span className="grow" />
      </div>
    </form>
  );
}
