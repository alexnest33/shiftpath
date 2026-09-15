import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <section className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Регистрация</h1>
        <p className="mt-2 mb-6 text-sm text-zinc-600">
          Создайте аккаунт ShiftPath по email и паролю.
        </p>
        <SignUpForm />
      </section>
    </main>
  );
}
