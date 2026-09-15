import Link from "next/link";

export default function ConfirmationErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Не удалось подтвердить email</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Ссылка недействительна, устарела или уже была использована. Попробуйте
          войти в аккаунт или запросите новое письмо позже.
        </p>
        <Link
          className="mt-6 inline-flex rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white"
          href="/login"
        >
          Перейти ко входу
        </Link>
      </section>
    </main>
  );
}
