import { redirect } from "next/navigation";

import { signOut } from "@/app/auth/actions";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div>
        <p className="text-sm font-medium text-zinc-500">ShiftPath</p>
        <h1 className="mt-1 text-3xl font-semibold">Личный кабинет</h1>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-500">Вы вошли как</p>
        <p className="mt-1 font-medium">{user.email ?? "Email не указан"}</p>
      </section>

      <form action={signOut}>
        <SignOutButton />
      </form>
    </main>
  );
}
