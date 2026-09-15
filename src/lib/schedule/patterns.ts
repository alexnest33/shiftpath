import type { ScheduleType } from "@/types/domain";

export const PRESET_PATTERNS = {
  "2_2": [true, true, false, false],
  "3_3": [true, true, true, false, false, false],
  "2_2_3": [
    true,
    true,
    false,
    false,
    true,
    true,
    true,
    false,
    false,
    true,
    true,
    false,
    false,
    false,
  ],
  "5_2": [true, true, true, true, true, false, false],
  "1_3": [true, false, false, false],
} as const satisfies Record<Exclude<ScheduleType, "custom">, readonly boolean[]>;

export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  "2_2": "2/2",
  "3_3": "3/3",
  "2_2_3": "2/2/3",
  "5_2": "5/2",
  "1_3": "Сутки/трое",
  custom: "Свой цикл",
};

export const MAX_CYCLE_LENGTH = 366;

export function isScheduleType(value: string): value is ScheduleType {
  return Object.hasOwn(SCHEDULE_TYPE_LABELS, value);
}

export function isValidCyclePattern(
  pattern: unknown,
): pattern is boolean[] {
  return (
    Array.isArray(pattern) &&
    pattern.length >= 1 &&
    pattern.length <= MAX_CYCLE_LENGTH &&
    pattern.every((day) => typeof day === "boolean")
  );
}

export function parseCustomPattern(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);

    return isValidCyclePattern(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function addCycleDay(
  pattern: readonly boolean[],
  isWorkDay: boolean,
) {
  if (pattern.length >= MAX_CYCLE_LENGTH) {
    return [...pattern];
  }

  return [...pattern, isWorkDay];
}

export function removeLastCycleDay(pattern: readonly boolean[]) {
  return pattern.slice(0, -1);
}

export function getSchedulePattern(
  type: ScheduleType,
  customPattern: readonly boolean[],
) {
  if (type === "custom") {
    return isValidCyclePattern(customPattern) ? [...customPattern] : null;
  }

  return [...PRESET_PATTERNS[type]];
}
