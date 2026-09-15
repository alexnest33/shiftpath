const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

interface PlainDate {
  year: number;
  month: number;
  day: number;
}

export type CycleDayType = "work" | "off";

export interface CalendarDay {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  type: CycleDayType;
}

export function getLocalCalendarMonth(date: Date = new Date()) {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function createUtcDate({ year, month, day }: PlainDate) {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date;
}

function parseIsoDate(value: string): PlainDate | null {
  const match = ISO_DATE_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const parsed = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };

  if (parsed.year < 1 || parsed.year > 9999) {
    return null;
  }

  const date = createUtcDate(parsed);

  if (
    date.getUTCFullYear() !== parsed.year ||
    date.getUTCMonth() + 1 !== parsed.month ||
    date.getUTCDate() !== parsed.day
  ) {
    return null;
  }

  return parsed;
}

function toEpochDay(value: string) {
  const parsed = parseIsoDate(value);

  if (!parsed) {
    throw new RangeError(`Invalid calendar date: ${value}`);
  }

  return Math.floor(createUtcDate(parsed).getTime() / MILLISECONDS_PER_DAY);
}

function fromEpochDay(epochDay: number) {
  const date = new Date(epochDay * MILLISECONDS_PER_DAY);
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isValidCalendarDate(value: string) {
  return parseIsoDate(value) !== null;
}

export function getCycleDayType(
  startsOn: string,
  targetDate: string,
  pattern: readonly boolean[],
): CycleDayType {
  if (pattern.length === 0) {
    throw new RangeError("A schedule pattern must contain at least one day.");
  }

  const dayOffset = toEpochDay(targetDate) - toEpochDay(startsOn);
  const patternIndex =
    ((dayOffset % pattern.length) + pattern.length) % pattern.length;

  return pattern[patternIndex] ? "work" : "off";
}

export function generateCalendarMonth(
  year: number,
  month: number,
  startsOn: string,
  pattern: readonly boolean[],
): CalendarDay[] {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new RangeError("Calendar year must be between 1 and 9999.");
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError("Calendar month must be between 1 and 12.");
  }

  const firstDay = createUtcDate({ year, month, day: 1 });
  const firstEpochDay = Math.floor(firstDay.getTime() / MILLISECONDS_PER_DAY);
  const leadingDays = (firstDay.getUTCDay() + 6) % 7;
  const daysInMonth = createUtcDate({ year, month: month + 1, day: 0 }).getUTCDate();
  const cellCount = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
  const gridStart = firstEpochDay - leadingDays;

  return Array.from({ length: cellCount }, (_, index) => {
    const date = fromEpochDay(gridStart + index);
    const parsed = parseIsoDate(date)!;

    return {
      date,
      dayNumber: parsed.day,
      isCurrentMonth: parsed.year === year && parsed.month === month,
      type: getCycleDayType(startsOn, date, pattern),
    };
  });
}
