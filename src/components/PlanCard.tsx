"use client";

import { useState } from "react";
import {
  setStatus,
  deletePlan,
  addItem,
  toggleItem,
  deleteItem,
  saveEntry,
  deletePhoto,
} from "@/app/us/actions";
import { PlanForm } from "@/components/PlanForm";
import { PhotoUploader } from "@/components/PhotoUploader";
import { Reschedule } from "@/components/Reschedule";

export type PlanView = {
  id: string;
  title: string;
  place: string | null;
  note: string | null;
  status: "PLANNED" | "DONE" | "SKIPPED";
  remindDaysBefore: number | null;
  dateInput: string;
  startTime: string | null;
  month: string | null;
  dayNumber: string | null;
  weekday: string | null;
  timeLabel: string;
  daysAway: number | null;
  movedCount: number;
  items: { id: string; text: string; done: boolean }[];
  photos: { id: string; url: string }[];
  entry: { body: string; by: string | null } | null;
};

function statusPill(plan: PlanView) {
  if (plan.status === "DONE") return <span className="tag warm">we went</span>;
  if (plan.daysAway === null) return <span className="tag">no date yet</span>;
  if (plan.daysAway < 0) return <span className="tag late">missed it</span>;
  if (plan.daysAway === 0) return <span className="tag warm">today</span>;
  if (plan.daysAway === 1) return <span className="tag warm">tomorrow</span>;
  if (plan.daysAway <= 7) return <span className="tag warm">this week</span>;
  return null;
}

export function PlanCard({ plan }: { plan: PlanView }) {
  const [editing, setEditing] = useState(false);
  const [writing, setWriting] = useState(false);

  const missed = plan.status === "PLANNED" && plan.daysAway !== null && plan.daysAway < 0;
  const done = plan.status === "DONE";
  const ticked = plan.items.filter((item) => item.done).length;

  if (editing) {
    return (
      <PlanForm
        existing={{
          id: plan.id,
          title: plan.title,
          place: plan.place,
          date: plan.dateInput,
          startTime: plan.startTime,
          note: plan.note,
          remindDaysBefore: plan.remindDaysBefore,
          items: "",
        }}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <article className={`plan${missed ? " slipped" : ""}${done ? " kept" : ""}`}>
      <div className="when">
        {plan.month ? (
          <>
            <div className="mon">{plan.month}</div>
            <div className="day">{plan.dayNumber}</div>
            <div className="dow">{plan.weekday}</div>
            <div className="hr">{plan.timeLabel}</div>
          </>
        ) : (
          <>
            <div className="mon">Someday</div>
            <div className="day">?</div>
            <div className="dow">when we can</div>
          </>
        )}
      </div>

      <div className="body">
        <div className="rowtop">
          <h3>{plan.title}</h3>
          {statusPill(plan)}
          {plan.movedCount > 0 ? (
            <span className="tag">
              moved {plan.movedCount === 1 ? "once" : `${plan.movedCount} times`}
            </span>
          ) : null}
        </div>

        {plan.place ? (
          <div className="place">
            at <b>{plan.place}</b>
          </div>
        ) : null}

        {plan.note ? <p className="note">{plan.note}</p> : null}

        {plan.items.length ? (
          <ul className="checklist">
            {plan.items.map((item) => (
              <li key={item.id} data-done={item.done}>
                <form action={toggleItem} className="tick">
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    className="tickbox"
                    data-done={item.done}
                    type="submit"
                    aria-label={item.done ? `Untick ${item.text}` : `Tick ${item.text}`}
                  />
                </form>
                <span className="text">{item.text}</span>
                <form action={deleteItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <button className="btn quiet drop" type="submit" aria-label={`Remove ${item.text}`}>
                    &times;
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}

        <form action={addItem} className="addline">
          <input type="hidden" name="planId" value={plan.id} />
          <input
            id={`add-${plan.id}`}
            name="text"
            maxLength={120}
            placeholder="add something"
            aria-label="Add something to sort"
          />
          <button className="btn quiet" type="submit">add</button>
        </form>

        {plan.photos.length ? (
          <div className="gallery">
            {plan.photos.map((photo) => (
              <figure className="shot" key={photo.id} style={{ margin: 0 }}>
                {/* Photos live in our own bucket, so the plain tag is right here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" loading="lazy" />
                <form action={deletePhoto}>
                  <input type="hidden" name="id" value={photo.id} />
                  <button className="drop" type="submit" aria-label="Remove photo">
                    &times;
                  </button>
                </form>
              </figure>
            ))}
          </div>
        ) : null}

        {plan.entry && !writing ? (
          <div className="entry">
            <p>{plan.entry.body}</p>
            <div className="by">
              {plan.entry.by ? `written by ${plan.entry.by}` : "written afterwards"}
              {" · "}
              <button
                type="button"
                className="btn quiet"
                style={{ padding: 0, fontSize: 11 }}
                onClick={() => setWriting(true)}
              >
                change it
              </button>
            </div>
          </div>
        ) : null}

        {writing ? (
          <form
            action={async (formData) => {
              await saveEntry(formData);
              setWriting(false);
            }}
            style={{ marginTop: 14 }}
          >
            <input type="hidden" name="planId" value={plan.id} />
            <label className="field">
              <span>How it went</span>
              <textarea
                name="body"
                defaultValue={plan.entry?.body ?? ""}
                placeholder="What happened"
                style={{ minHeight: 130, fontFamily: "var(--hand)", fontSize: 21 }}
              />
            </label>
            <div className="panelfoot">
              <button className="btn solid" type="submit">Keep this</button>
              <button type="button" className="btn" onClick={() => setWriting(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        <div className="foot">
          <span className="tag">
            {ticked}/{plan.items.length} sorted
          </span>
          <span className="grow" />

          {missed ? <Reschedule id={plan.id} hasDate={Boolean(plan.dateInput)} /> : null}

          {done ? (
            <>
              <PhotoUploader planId={plan.id} />
              {!plan.entry && !writing ? (
                <button type="button" className="btn" onClick={() => setWriting(true)}>
                  Write it down
                </button>
              ) : null}
              <form action={setStatus}>
                <input type="hidden" name="id" value={plan.id} />
                <input type="hidden" name="status" value="PLANNED" />
                <button className="btn quiet" type="submit">Not yet</button>
              </form>
            </>
          ) : (
            <form action={setStatus}>
              <input type="hidden" name="id" value={plan.id} />
              <input type="hidden" name="status" value="DONE" />
              <button className="btn" type="submit">We went</button>
            </form>
          )}

          <button type="button" className="btn quiet" onClick={() => setEditing(true)}>
            Edit
          </button>
          <form action={deletePlan}>
            <input type="hidden" name="id" value={plan.id} />
            <button className="btn quiet" type="submit" aria-label={`Delete ${plan.title}`}>
              Delete
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
