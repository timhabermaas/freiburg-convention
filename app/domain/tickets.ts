import { AgeCategory, SupporterCategory } from "./types";

export function price(
  age: AgeCategory,
  basePrice: number,
  supporterCategory: SupporterCategory
): number {
  if (age === "Baby") {
    return 0;
  }

  let result = basePrice;

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
