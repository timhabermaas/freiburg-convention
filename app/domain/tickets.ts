import { assertNever } from "~/utils";
import { AgeCategory, Day, Duration, SupporterCategory } from "./types";

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

export function stayFromDuration(
  duration: Duration,
  firstDay: Day,
  lastDay: Day
): [Day, Day] {
  switch (duration) {
    case "Fr-Mo":
      return [firstDay, lastDay];
    case "Fr-Su":
      return [firstDay, lastDay.addDays(-1)];
    case "Sa-Mo":
      return [firstDay.addDays(1), lastDay];
  }
}
