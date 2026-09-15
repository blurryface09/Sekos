"use client";

import { useRef, useState } from "react";
import { signPhotoUpload, attachPhoto } from "@/app/us/actions";

export function PhotoUploader({ planId }: { planId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<{ busy: boolean; error: string }>({
    busy: false,
    error: "",
  });

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setState({ busy: true, error: "" });

    try {
      for (const file of Array.from(files)) {
        const signed = await signPhotoUpload(planId, file.type);
        if ("error" in signed) {
          setState({ busy: false, error: signed.error });
          return;
        }

        const response = await fetch(signed.uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        if (!response.ok) {
          setState({ busy: false, error: "That photo did not upload. Try again." });
          return;
        }

        await attachPhoto(planId, signed.key, signed.url);
      }
      setState({ busy: false, error: "" });
    } catch {
      setState({ busy: false, error: "That photo did not upload. Try again." });
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={input}
        id={`photos-${planId}`}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        hidden
        onChange={(event) => void upload(event.target.files)}
      />
      <button
        type="button"
        className="btn"
        disabled={state.busy}
        onClick={() => input.current?.click()}
      >
        {state.busy ? "Adding" : "Add photos"}
      </button>
      {state.error ? (
        <span className="hint" style={{ color: "var(--rose-deep)" }}>
          {state.error}
        </span>
      ) : null}
    </>
  );
}
