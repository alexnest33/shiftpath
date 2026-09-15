"use server";

import { redirect } from "next/navigation";

import { getSiteOrigin } from "@/lib/auth/urls";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/types/auth";

interface Credentials {
  email: string;
  password: string;
}

interface ValidationResult {
  credentials?: Credentials;
  fieldErrors?: AuthActionState["fieldErrors"];
}

function validateCredentials(
  formData: FormData,
  options: { requireStrongPassword: boolean },
): ValidationResult {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";
  const fieldErrors: NonNullable<AuthActionState["fieldErrors"]> = {};

  if (!email || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) {
    fieldErrors.email = "Введите корректный email.";
  }

  if (!password) {
    fieldErrors.password = "Введите пароль.";
  } else if (password.length > 128) {
    fieldErrors.password = "Пароль слишком длинный.";
  } else if (options.requireStrongPassword && password.length < 8) {
    fieldErrors.password = "Пароль должен содержать не менее 8 символов.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return { credentials: { email, password } };
}

export async function login(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const validation = validateCredentials(formData, {
    requireStrongPassword: false,
  });

  if (!validation.credentials) {
    return {
      status: "error",
      message: "Проверьте заполнение формы.",
      fieldErrors: validation.fieldErrors,
    };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword(
      validation.credentials,
    );

    if (error) {
      return {
        status: "error",
        message: "Не удалось войти. Проверьте email и пароль.",
      };
    }
  } catch {
    return {
      status: "error",
      message: "Сервис авторизации временно недоступен. Попробуйте ещё раз.",
    };
  }

  redirect("/dashboard");
}

export async function signUp(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const validation = validateCredentials(formData, {
    requireStrongPassword: true,
  });

  if (!validation.credentials) {
    return {
      status: "error",
      message: "Проверьте заполнение формы.",
      fieldErrors: validation.fieldErrors,
    };
  }

  const supabase = await createClient();
  const emailRedirectTo = new URL(
    "/auth/confirm",
    await getSiteOrigin(),
  ).toString();
  let hasSession = false;

  try {
    const { data, error } = await supabase.auth.signUp({
      ...validation.credentials,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      return {
        status: "error",
        message: "Не удалось создать аккаунт. Проверьте данные и попробуйте снова.",
      };
    }

    hasSession = Boolean(data.session);
  } catch {
    return {
      status: "error",
      message: "Сервис авторизации временно недоступен. Попробуйте ещё раз.",
    };
  }

  if (hasSession) {
    redirect("/dashboard");
  }

  return {
    status: "success",
    message:
      "Аккаунт создан. Проверьте почту и подтвердите email, затем войдите.",
  };
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();
  redirect("/login");
}
