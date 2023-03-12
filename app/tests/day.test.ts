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
