"use client";

import { useState } from "react";
import { PlanForm } from "@/components/PlanForm";

export function NewPlanButton() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" className="btn solid" onClick={() => setOpen(true)}>
        + New plan
      </button>
    );
  }

  return <PlanForm onDone={() => setOpen(false)} />;
}
