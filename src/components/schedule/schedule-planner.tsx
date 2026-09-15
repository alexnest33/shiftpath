"use client";

import { useActionState, useMemo, useState } from "react";

import { saveSchedule } from "@/app/dashboard/actions";
import {
  generateCalendarMonth,
  getLocalCalendarMonth,
  isValidCalendarDate,
} from "@/lib/schedule/calendar";
import {
  addCycleDay,
  getSchedulePattern,
  MAX_CYCLE_LENGTH,
  removeLastCycleDay,
  SCHEDULE_TYPE_LABELS,
} from "@/lib/schedule/patterns";
import type { ScheduleType } from "@/types/domain";
import type {
  ActiveScheduleFormValue,
  ScheduleActionState,
} from "@/types/schedule";

const initialActionState: ScheduleActionState = { status: "idle" };
const scheduleTypes = Object.keys(SCHEDULE_TYPE_LABELS) as ScheduleType[];
const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const monthNames = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

interface SchedulePlannerProps {
  initialSchedule: ActiveScheduleFormValue | null;
  loadError: boolean;
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function shiftMonth(value: string, offset: number) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1 + offset, 1);

  return `${String(date.getUTCFullYear()).padStart(4, "0")}-${String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
}

export function SchedulePlanner({
  initialSchedule,
  loadError,
}: SchedulePlannerProps) {
  const [state, formAction, isPending] = useActionState(
    saveSchedule,
    initialActionState,
  );
  const [name, setName] = useState(initialSchedule?.name ?? "Мой график");
  const [scheduleType, setScheduleType] = useState<ScheduleType>(
    initialSchedule?.schedule_type ?? "2_2",
  );
  const [startsOn, setStartsOn] = useState(
    initialSchedule?.starts_on ?? getTodayIso(),
  );
  const [customPattern, setCustomPattern] = useState<boolean[]>(
    initialSchedule?.schedule_type === "custom"
      ? [...initialSchedule.cycle_pattern]
      : [],
  );
  const [selectedMonth, setSelectedMonth] = useState(() =>
    getLocalCalendarMonth(),
  );
  const [dismissedActionState, setDismissedActionState] =
    useState<ScheduleActionState | null>(null);
  const visibleState =
    dismissedActionState === state ? initialActionState : state;

  function clearActionFeedback() {
    setDismissedActionState(state);
  }

  const pattern = useMemo(
    () => getSchedulePattern(scheduleType, customPattern),
    [customPattern, scheduleType],
  );
  const [calendarYear, calendarMonth] = selectedMonth.split("-").map(Number);
  const calendarDays = useMemo(() => {
    if (!pattern || !isValidCalendarDate(startsOn)) {
      return [];
    }

    return generateCalendarMonth(
      calendarYear,
      calendarMonth,
      startsOn,
      pattern,
    );
  }, [calendarMonth, calendarYear, pattern, startsOn]);
  const currentMonthDays = calendarDays.filter((day) => day.isCurrentMonth);
  const workDays = currentMonthDays.filter((day) => day.type === "work").length;
  const offDays = currentMonthDays.length - workDays;
  const visiblePattern = pattern?.slice(0, 42) ?? [];
  const localCustomError =
    scheduleType === "custom" && !pattern
      ? "Добавьте хотя бы один день в собственный цикл."
      : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
      <section
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-7"
        aria-labelledby="schedule-form-title"
      >
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-indigo-600 uppercase">
            {initialSchedule ? "Активный график" : "Новый график"}
          </p>
          <h2 id="schedule-form-title" className="mt-2 text-2xl font-semibold text-slate-950">
            {initialSchedule ? "Изменить цикл" : "Настроить цикл"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Выберите готовую схему или соберите собственную последовательность.
          </p>
        </div>

        {loadError && (
          <p className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
            Не удалось загрузить сохранённый график. Можно попробовать обновить страницу.
          </p>
        )}

        <form action={formAction} className="space-y-6">
          <div>
            <label htmlFor="schedule-name" className="text-sm font-semibold text-slate-800">
              Название графика
            </label>
            <input
              id="schedule-name"
              name="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                clearActionFeedback();
              }}
              maxLength={100}
              required
              aria-describedby={visibleState.fieldErrors?.name ? "schedule-name-error" : undefined}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-100"
            />
            {visibleState.fieldErrors?.name && (
              <p id="schedule-name-error" className="mt-2 text-sm text-red-700">
                {visibleState.fieldErrors.name}
              </p>
            )}
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-800">Тип графика</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {scheduleTypes.map((type) => (
                <label
                  key={type}
                  className={`cursor-pointer rounded-xl border px-3 py-3 text-center text-sm font-semibold transition has-focus-visible:ring-4 has-focus-visible:ring-indigo-100 ${
                    scheduleType === type
                      ? "border-indigo-600 bg-indigo-50 text-indigo-950"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="scheduleType"
                    value={type}
                    checked={scheduleType === type}
                    onChange={() => {
                      setScheduleType(type);
                      clearActionFeedback();
                    }}
                  />
                  {SCHEDULE_TYPE_LABELS[type]}
                </label>
              ))}
            </div>
            {visibleState.fieldErrors?.scheduleType && (
              <p className="mt-2 text-sm text-red-700">{visibleState.fieldErrors.scheduleType}</p>
            )}
          </fieldset>

          {scheduleType === "custom" && (
            <fieldset aria-describedby="custom-pattern-hint custom-pattern-error">
              <legend className="text-sm font-semibold text-slate-800">
                Собственный цикл
              </legend>
              <input
                type="hidden"
                name="customPattern"
                value={JSON.stringify(customPattern)}
              />
              <p id="custom-pattern-hint" className="mt-2 text-xs leading-5 text-slate-500">
                Добавляйте дни по порядку. Первый добавленный день соответствует дате начала цикла.
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomPattern((current) => addCycleDay(current, true));
                    clearActionFeedback();
                  }}
                  disabled={customPattern.length >= MAX_CYCLE_LENGTH}
                  className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Добавить рабочий день
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomPattern((current) => addCycleDay(current, false));
                    clearActionFeedback();
                  }}
                  disabled={customPattern.length >= MAX_CYCLE_LENGTH}
                  className="rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Добавить выходной
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700" aria-live="polite">
                  Длина цикла: {customPattern.length} из {MAX_CYCLE_LENGTH}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomPattern((current) => removeLastCycleDay(current));
                      clearActionFeedback();
                    }}
                    disabled={customPattern.length === 0}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Удалить последний
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomPattern([]);
                      clearActionFeedback();
                    }}
                    disabled={customPattern.length === 0}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Очистить цикл
                  </button>
                </div>
              </div>

              {customPattern.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-600">
                  Цикл пока пуст. Например, для двух рабочих и двух выходных нажмите:
                  рабочий, рабочий, выходной, выходной.
                </div>
              ) : (
                <ol
                  className="mt-4 flex max-h-52 flex-wrap gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3"
                  aria-label="Последовательность дней собственного цикла"
                >
                  {customPattern.map((isWorkDay, index) => (
                    <li
                      key={index}
                      className={`rounded-lg border px-2.5 py-2 text-xs font-semibold ${
                        isWorkDay
                          ? "border-indigo-200 bg-indigo-50 text-indigo-950"
                          : "border-emerald-200 bg-emerald-50 text-emerald-950"
                      }`}
                    >
                      <span className="mr-1 opacity-60">{index + 1}.</span>
                      {isWorkDay ? "Рабочий" : "Выходной"}
                    </li>
                  ))}
                </ol>
              )}

              {(visibleState.fieldErrors?.customPattern || localCustomError) && (
                <p id="custom-pattern-error" className="mt-2 text-sm text-red-700">
                  {visibleState.fieldErrors?.customPattern ?? localCustomError}
                </p>
              )}
            </fieldset>
          )}

          <div>
            <label htmlFor="starts-on" className="text-sm font-semibold text-slate-800">
              Дата начала цикла
            </label>
            <input
              id="starts-on"
              name="startsOn"
              type="date"
              value={startsOn}
              onChange={(event) => {
                setStartsOn(event.target.value);
                clearActionFeedback();
              }}
              required
              aria-describedby="starts-on-hint starts-on-error"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-100"
            />
            <p id="starts-on-hint" className="mt-2 text-xs leading-5 text-slate-500">
              Эта дата соответствует первому дню последовательности и задаёт точку отсчёта.
            </p>
            {visibleState.fieldErrors?.startsOn && (
              <p id="starts-on-error" className="mt-2 text-sm text-red-700">
                {visibleState.fieldErrors.startsOn}
              </p>
            )}
          </div>

          {pattern && scheduleType !== "custom" && (
            <div aria-label="Предпросмотр последовательности">
              <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">
                Цикл · {pattern.length} дн.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {visiblePattern.map((isWorkDay, index) => (
                  <span
                    key={index}
                    className={`flex size-7 items-center justify-center rounded-md text-xs font-bold ${
                      isWorkDay
                        ? "bg-indigo-600 text-white"
                        : "bg-emerald-100 text-emerald-900"
                    }`}
                    title={isWorkDay ? "Рабочий день" : "Выходной"}
                  >
                    {isWorkDay ? "Р" : "В"}
                  </span>
                ))}
                {pattern.length > visiblePattern.length && (
                  <span className="self-center text-xs text-slate-500">
                    +{pattern.length - visiblePattern.length}
                  </span>
                )}
              </div>
            </div>
          )}

          {visibleState.message && (
            <p
              className={`rounded-xl px-4 py-3 text-sm ${
                visibleState.status === "success"
                  ? "bg-emerald-50 text-emerald-900"
                  : "bg-red-50 text-red-800"
              }`}
              role={visibleState.status === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {visibleState.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || Boolean(localCustomError)}
            className="w-full rounded-xl bg-slate-950 px-5 py-3.5 font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? "Сохраняем…"
              : initialSchedule
                ? "Сохранить изменения"
                : "Сохранить график"}
          </button>
        </form>
      </section>

      <section
        className="rounded-3xl bg-slate-950 p-4 text-white shadow-[0_24px_70px_rgba(15,23,42,0.2)] sm:p-7"
        aria-labelledby="calendar-title"
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedMonth((month) => shiftMonth(month, -1))}
            className="flex size-10 items-center justify-center rounded-full border border-white/20 text-xl transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/50"
            aria-label="Предыдущий месяц"
          >
            ←
          </button>
          <div className="text-center">
            <p className="text-xs font-semibold tracking-[0.18em] text-indigo-300 uppercase">
              Предпросмотр
            </p>
            <h2 id="calendar-title" className="mt-1 text-xl font-semibold sm:text-2xl">
              {monthNames[calendarMonth - 1]} {calendarYear}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setSelectedMonth((month) => shiftMonth(month, 1))}
            className="flex size-10 items-center justify-center rounded-full border border-white/20 text-xl transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/50"
            aria-label="Следующий месяц"
          >
            →
          </button>
        </div>

        {calendarDays.length > 0 ? (
          <>
            <div className="mt-7 overflow-hidden rounded-2xl bg-white p-2 text-slate-950 sm:p-3">
              <table className="w-full table-fixed border-separate border-spacing-1" aria-label="Календарь смен">
                <thead>
                  <tr>
                    {weekDays.map((day) => (
                      <th key={day} scope="col" className="pb-2 text-center text-[0.65rem] font-bold text-slate-400 sm:text-xs">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: calendarDays.length / 7 }, (_, weekIndex) => (
                    <tr key={weekIndex}>
                      {calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7).map((day) => (
                        <td key={day.date} className="p-0.5 align-top">
                          <div
                            className={`flex aspect-square min-h-9 flex-col items-center justify-center rounded-lg text-xs font-semibold sm:min-h-12 sm:text-sm ${
                              day.type === "work"
                                ? "bg-indigo-100 text-indigo-950"
                                : "bg-emerald-50 text-emerald-950"
                            } ${day.isCurrentMonth ? "" : "opacity-35"}`}
                            aria-label={`${day.date}: ${day.type === "work" ? "рабочий день" : "выходной"}`}
                          >
                            <time dateTime={day.date}>{day.dayNumber}</time>
                            <span className="mt-0.5 hidden text-[0.55rem] font-bold tracking-wide uppercase sm:block">
                              {day.type === "work" ? "смена" : "выходной"}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300" aria-label="Легенда календаря">
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-sm bg-indigo-300" aria-hidden="true" />
                Рабочий день
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-sm bg-emerald-200" aria-hidden="true" />
                Выходной
              </span>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <dt className="text-xs text-slate-300">Рабочих дней</dt>
                <dd className="mt-1 text-3xl font-semibold">{workDays}</dd>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <dt className="text-xs text-slate-300">Выходных</dt>
                <dd className="mt-1 text-3xl font-semibold">{offDays}</dd>
              </div>
            </dl>
          </>
        ) : (
          <div className="mt-7 rounded-2xl border border-dashed border-white/20 px-5 py-12 text-center text-sm leading-6 text-slate-300">
            Заполните дату и корректную последовательность, чтобы увидеть календарь.
          </div>
        )}
      </section>
    </div>
  );
}
