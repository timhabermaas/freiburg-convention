import { AgeCategory, SupporterCategory } from "./types";

export function price(
  age: AgeCategory,
  basePrice: number,
  supporterCategory: SupporterCategory,
  soliOffset: number | null,
  supporterOffset: number | null
): number {
  if (age === "Baby") {
    return 0;
  }

  let result = basePrice;

  if (age === "Child") {
    result = result / 2;
  }

  if (supporterCategory === "Supporter") {
    result += supporterOffset ?? 0;
  } else if (supporterCategory === "Cheaper") {
    result += soliOffset ?? 0;
  }

  return result;
}
