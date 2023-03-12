import { assertNever } from "~/utils";
import { AgeCategory, Day, Duration, SupporterCategory, Ticket } from "./types";

export function price(
  age: AgeCategory,
  stayLength: Duration,
  supporterCategory: SupporterCategory
): number {
  if (age === "Baby") {
    return 0;
  }

  let result = 0;
  switch (stayLength) {
    case "Fr-Mo": {
      result = 4500;
      break;
    }
    case "Fr-Su":
    case "Sa-Mo": {
      result = 3500;
      break;
    }
    default:
      assertNever(stayLength);
  }

  if (age === "Child") {
    result = result / 2;
  }

  if (supporterCategory === "Cheaper") {
    result -= 1000;
  } else if (supporterCategory === "Supporter") {
    result += 1000;
  }

  return result;
}

export function stayFromDuration(duration: Duration): [Day, Day] {
  const firstDay = new Day(2023, 5, 26);
  const lastDay = new Day(2023, 5, 29);

  switch (duration) {
    case "Fr-Mo":
      return [firstDay, lastDay];
    case "Fr-Su":
      return [firstDay, lastDay.addDays(-1)];
    case "Sa-Mo":
      return [firstDay.addDays(1), lastDay];
  }
}

export const TICKETS: Ticket[] = [
  // 4 days
  {
    ticketId: "t-1",
    from: new Day(2022, 5, 26),
    to: new Day(2022, 5, 29),
    ageCategory: "OlderThan12",
    price: 4400,
  },
  {
    ticketId: "t-2",
    from: new Day(2022, 5, 26),
    to: new Day(2022, 5, 29),
    ageCategory: "Child",
    price: 2500,
  },
  {
    ticketId: "t-3",
    from: new Day(2022, 5, 26),
    to: new Day(2022, 5, 29),
    ageCategory: "Baby",
    price: 0,
  },
  // 3 days
  {
    ticketId: "t-4",
    from: new Day(2022, 5, 27),
    to: new Day(2022, 5, 29),
    ageCategory: "OlderThan12",
    price: 3500,
  },
  {
    ticketId: "t-5",
    from: new Day(2022, 5, 27),
    to: new Day(2022, 5, 29),
    ageCategory: "Child",
    price: 2000,
  },
  {
    ticketId: "t-6",
    from: new Day(2022, 5, 27),
    to: new Day(2022, 5, 29),
    ageCategory: "Baby",
    price: 0,
  },
];
