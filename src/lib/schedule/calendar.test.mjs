import assert from "node:assert/strict";
import test from "node:test";

import {
  generateCalendarMonth,
  getCycleDayType,
  getLocalCalendarMonth,
} from "./calendar.ts";
import {
  addCycleDay,
  parseCustomPattern,
  PRESET_PATTERNS,
  removeLastCycleDay,
} from "./patterns.ts";

test("calculates a repeating 2/2 schedule", () => {
  const pattern = PRESET_PATTERNS["2_2"];

  assert.equal(getCycleDayType("2026-09-01", "2026-09-01", pattern), "work");
  assert.equal(getCycleDayType("2026-09-01", "2026-09-02", pattern), "work");
  assert.equal(getCycleDayType("2026-09-01", "2026-09-03", pattern), "off");
  assert.equal(getCycleDayType("2026-09-01", "2026-09-05", pattern), "work");
});

test("calculates a repeating 3/3 schedule", () => {
  const pattern = PRESET_PATTERNS["3_3"];

  assert.equal(getCycleDayType("2026-09-01", "2026-09-03", pattern), "work");
  assert.equal(getCycleDayType("2026-09-01", "2026-09-04", pattern), "off");
  assert.equal(getCycleDayType("2026-09-01", "2026-09-07", pattern), "work");
});

test("calculates the full 14-day 2/2/3 schedule", () => {
  const pattern = PRESET_PATTERNS["2_2_3"];
  const actual = Array.from({ length: 14 }, (_, offset) => {
    const day = String(offset + 1).padStart(2, "0");
    return getCycleDayType("2026-09-01", `2026-09-${day}`, pattern) === "work";
  });

  assert.deepEqual(actual, [...pattern]);
});

test("calculates a repeating 5/2 schedule", () => {
  const pattern = PRESET_PATTERNS["5_2"];

  assert.deepEqual([...pattern], [true, true, true, true, true, false, false]);
  assert.equal(getCycleDayType("2026-09-01", "2026-09-05", pattern), "work");
  assert.equal(getCycleDayType("2026-09-01", "2026-09-06", pattern), "off");
  assert.equal(getCycleDayType("2026-09-01", "2026-09-08", pattern), "work");
});

test("calculates a repeating one-on, three-off schedule", () => {
  const pattern = PRESET_PATTERNS["1_3"];

  assert.deepEqual([...pattern], [true, false, false, false]);
  assert.equal(getCycleDayType("2026-09-01", "2026-09-01", pattern), "work");
  assert.equal(getCycleDayType("2026-09-01", "2026-09-02", pattern), "off");
  assert.equal(getCycleDayType("2026-09-01", "2026-09-05", pattern), "work");
});

test("uses a positive modulo for dates before starts_on", () => {
  const pattern = PRESET_PATTERNS["2_2"];

  assert.equal(getCycleDayType("2026-09-10", "2026-09-09", pattern), "off");
  assert.equal(getCycleDayType("2026-09-10", "2026-09-08", pattern), "off");
  assert.equal(getCycleDayType("2026-09-10", "2026-09-07", pattern), "work");
});

test("builds a complete Monday-first grid across month boundaries", () => {
  const days = generateCalendarMonth(2026, 9, "2026-09-01", PRESET_PATTERNS["2_2"]);

  assert.equal(days.length % 7, 0);
  assert.equal(days[0].date, "2026-08-31");
  assert.equal(days.at(-1)?.date, "2026-10-04");
  assert.equal(days[0].isCurrentMonth, false);
  assert.equal(days[1].isCurrentMonth, true);
});

test("does not add adjacent dates when a month already fills whole weeks", () => {
  const days = generateCalendarMonth(2021, 2, "2021-02-01", PRESET_PATTERNS["2_2"]);

  assert.equal(days.length, 28);
  assert.equal(days[0].date, "2021-02-01");
  assert.equal(days.at(-1)?.date, "2021-02-28");
  assert.equal(days.every((day) => day.isCurrentMonth), true);
});

test("includes leap day without shifting the cycle", () => {
  const days = generateCalendarMonth(2024, 2, "2024-02-28", PRESET_PATTERNS["2_2"]);
  const leapDay = days.find((day) => day.date === "2024-02-29");

  assert.equal(days.filter((day) => day.isCurrentMonth).length, 29);
  assert.equal(leapDay?.type, "work");
});

test("supports a custom repeating cycle", () => {
  const pattern = [true, false, false];

  assert.equal(getCycleDayType("2026-01-31", "2026-02-01", pattern), "off");
  assert.equal(getCycleDayType("2026-01-31", "2026-02-03", pattern), "work");
});

test("adds and removes days in a custom cycle", () => {
  let pattern = [];

  pattern = addCycleDay(pattern, true);
  pattern = addCycleDay(pattern, false);
  pattern = addCycleDay(pattern, false);
  assert.deepEqual(pattern, [true, false, false]);
  assert.deepEqual(parseCustomPattern(JSON.stringify(pattern)), pattern);

  pattern = removeLastCycleDay(pattern);
  assert.deepEqual(pattern, [true, false]);
  assert.deepEqual(removeLastCycleDay([]), []);
});

test("uses the browser-local date for the initial month and UTC days for cycle arithmetic", () => {
  const previousTimezone = process.env.TZ;

  try {
    process.env.TZ = "Europe/Minsk";

    const instant = new Date("2026-09-30T21:30:00.000Z");

    assert.equal(instant.toISOString().slice(0, 7), "2026-09");
    assert.equal(getLocalCalendarMonth(instant), "2026-10");
    assert.equal(
      getCycleDayType("2026-09-30", "2026-10-01", [true, false]),
      "off",
    );
  } finally {
    if (previousTimezone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = previousTimezone;
    }
  }
});
