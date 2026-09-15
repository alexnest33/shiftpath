import { redirect } from "next/navigation";

import { signOut } from "@/app/auth/actions";
import { SchedulePlanner } from "@/components/schedule/schedule-planner";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import type { ActiveScheduleFormValue } from "@/types/schedule";

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

  const { data: schedule, error: scheduleError } = await supabase
    .from("schedules")
    .select("name, schedule_type, starts_on, cycle_pattern")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  const activeSchedule = schedule as ActiveScheduleFormValue | null;
  const greetingName = user.email?.split("@")[0] ?? "друг";

  return (
    <main className="min-h-screen bg-[#f3f4ef] px-4 py-5 text-slate-950 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-7 flex items-start justify-between gap-4 sm:items-center">
          <div>
            <p className="text-sm font-bold tracking-[0.2em] text-indigo-600 uppercase">
              ShiftPath
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Привет, {greetingName}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Настройте ритм смен — календарь покажет рабочие дни и время для отдыха.
            </p>
          </div>
          <form action={signOut}>
            <SignOutButton />
          </form>
        </header>

        <SchedulePlanner
          initialSchedule={activeSchedule}
          loadError={Boolean(scheduleError)}
        />
      </div>
    </main>
  );
}
