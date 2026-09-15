import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <section className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Вход в ShiftPath</h1>
        <p className="mt-2 mb-6 text-sm text-zinc-600">
          Введите email и пароль, указанные при регистрации.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
