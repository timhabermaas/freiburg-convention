import { Day } from "../domain/types";

test("parsing roundtrip", () => {
  const cases = ["2023-10-02", "2023-01-12"];
  for (const c of cases) {
    const day = Day.parse(c);
    expect(day.toJSON()).toBe(c);
  }
});

test("adding days", () => {
  const cases = [
    ["2023-10-31", "2023-11-01"],
    ["2023-12-31", "2024-01-01"],
    ["2023-01-01", "2023-01-02"],
  ];

  for (const [input, output] of cases) {
    const day = Day.parse(input);
    expect(day.addDays(1).toJSON()).toBe(output);
  }
});

test("isWithin", () => {
  const from = new Day(2023, 11, 10);
  const to = new Day(2023, 11, 14);

  expect(new Day(2023, 11, 9).isWithin(from, to)).toBe(false);
  expect(new Day(2023, 11, 10).isWithin(from, to)).toBe(true);
  expect(new Day(2023, 11, 11).isWithin(from, to)).toBe(true);
  expect(new Day(2023, 11, 12).isWithin(from, to)).toBe(true);
  expect(new Day(2023, 11, 13).isWithin(from, to)).toBe(true);
  expect(new Day(2023, 11, 14).isWithin(from, to)).toBe(true);
  expect(new Day(2023, 11, 15).isWithin(from, to)).toBe(false);
});

test("lt", () => {
  const a = new Day(2023, 11, 10);

  expect(a.lt(new Day(2023, 11, 14))).toBe(true);
  expect(a.lt(new Day(2023, 11, 9))).toBe(false);
  expect(a.lt(new Day(2023, 11, 10))).toBe(false);
});

test("gt", () => {
  const a = new Day(2023, 11, 10);

  expect(a.gt(new Day(2023, 11, 14))).toBe(false);
  expect(a.gt(new Day(2023, 11, 9))).toBe(true);
  expect(a.gt(new Day(2023, 11, 10))).toBe(false);
});
