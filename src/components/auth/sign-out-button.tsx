"use client";

import { useFormStatus } from "react-dom";

export function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-lg border border-zinc-300 px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-60"
      type="submit"
      disabled={pending}
    >
      {pending ? "Выходим…" : "Выйти"}
    </button>
  );
}
