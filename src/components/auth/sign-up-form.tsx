"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signUp } from "@/app/auth/actions";
import type { AuthActionState } from "@/types/auth";

const initialState: AuthActionState = { status: "idle" };

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm font-medium">
        Email
        <input
          className="rounded-lg border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-zinc-700"
          type="email"
          name="email"
          autoComplete="email"
          required
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
        />
      </label>
      {state.fieldErrors?.email && (
        <p id="email-error" className="text-sm text-red-700">
          {state.fieldErrors.email}
        </p>
      )}

      <label className="flex flex-col gap-2 text-sm font-medium">
        Пароль
        <input
          className="rounded-lg border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-zinc-700"
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-describedby={
            state.fieldErrors?.password ? "password-error" : undefined
          }
        />
      </label>
      {state.fieldErrors?.password && (
        <p id="password-error" className="text-sm text-red-700">
          {state.fieldErrors.password}
        </p>
      )}

      {state.message && (
        <p
          className={
            state.status === "success" ? "text-sm text-green-700" : "text-sm text-red-700"
          }
          role={state.status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {state.message}
        </p>
      )}

      <button
        className="rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={isPending || state.status === "success"}
      >
        {isPending ? "Создаём аккаунт…" : "Создать аккаунт"}
      </button>

      <p className="text-center text-sm text-zinc-600">
        Уже есть аккаунт?{" "}
        <Link className="font-medium text-zinc-950 underline" href="/login">
          Войти
        </Link>
      </p>
    </form>
  );
}
