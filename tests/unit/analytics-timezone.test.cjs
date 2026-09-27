const test = require("node:test");
const assert = require("node:assert/strict");
const { newYorkDayStart } = require("../../features/analytics/timeZone.ts");

test("New York day boundaries follow midnight across daylight-saving changes", () => {
  assert.equal(newYorkDayStart(new Date("2026-09-27T20:00:00Z")), "2026-09-27T04:00:00.000Z");
  assert.equal(newYorkDayStart(new Date("2026-03-08T16:00:00Z")), "2026-03-08T05:00:00.000Z");
  assert.equal(newYorkDayStart(new Date("2026-11-01T16:00:00Z")), "2026-11-01T04:00:00.000Z");
  assert.equal(newYorkDayStart(new Date("2026-11-01T16:00:00Z"), 1), "2026-10-31T04:00:00.000Z");
});
