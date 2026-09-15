"use client";

import Link from "next/link";
import { useActionState } from "react";

import { login } from "@/app/auth/actions";
import type { AuthActionState } from "@/types/auth";

const initialState: AuthActionState = { status: "idle" };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

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
          autoComplete="current-password"
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
        <p className="text-sm text-red-700" role="alert" aria-live="polite">
          {state.message}
        </p>
      )}

      <button
        className="rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Входим…" : "Войти"}
      </button>

      <p className="text-center text-sm text-zinc-600">
        Нет аккаунта?{" "}
        <Link className="font-medium text-zinc-950 underline" href="/sign-up">
          Зарегистрироваться
        </Link>
      </p>
    </form>
  );
}
