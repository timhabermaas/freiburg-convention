import { z } from "zod";
import { Address, Ticket } from "./domain/types";
import {
  formatCurrency,
  LocaleMap,
  SupportedLocales,
  translateCategory,
} from "./i18n";

function setValueInPath(paths: string[], value: string, object: any) {
  if (paths.length === 1) {
    object[paths[0]] = value;
    return;
  }

  const [next, ...rest] = paths;

  if (object[next] && typeof object[next] === "object") {
    setValueInPath(rest, value, object[next]);
    return;
  } else {
    object[next] = {};
    setValueInPath(rest, value, object[next]);
  }
}

/**
 * Takes an object and converts all sub objects which only contain numbers as indices to an array.
 */
function convertToArray(object: any): any {
  for (const key in object) {
    if (typeof object[key] === "object") {
      object[key] = convertToArray(object[key]);
    }
  }

  const keys = Object.keys(object);
  if (keys.every((v) => /^\d+$/.test(v))) {
    const arr = [];
    for (const key in object) {
      arr[parseInt(key, 10)] = object[key];
    }
    return arr;
  } else {
    return object;
  }
}

export function parseFormData(formData: FormData): Record<string, unknown> {
  const result = {};

  for (const [key, value] of formData.entries()) {
    const paths = key.split(".");

    if (typeof value === "string") {
      setValueInPath(paths, value, result);
    }
  }
  return convertToArray(result);
}

/**
 * `start` and `end` are inclusive.
 */
export function arrayFromRange(start: number, end: number): number[] {
  const result = [];

  for (let i = start; i <= end; i += 1) {
    result.push(i);
  }

  return result;
}

function translateIssue(issue: z.ZodIssue): LocaleMap {
  const def = { de: issue.message, "en-US": issue.message };
  const required = { de: "Muss ausgefüllt sein", "en-US": "Required" };

  switch (issue.code) {
    case "invalid_string":
      return {
        de: `Invalide ${capitalize(issue.validation)}`,
        "en-US": `Invalid ${issue.validation}`,
      };
    case "invalid_type":
      if (issue.received === "undefined") {
        return { de: "Muss ausgefüllt sein", "en-US": "Required" };
      }
      break;
    case "invalid_union":
      return { de: "Muss ausgefüllt sein", "en-US": "Required" };
    case "too_small":
      if (issue.minimum === 1) {
        return required;
      }
      break;
  }

  return def;
}

export function errorsForPath(
  path: string,
  issues: z.ZodIssue[],
  locale: SupportedLocales
): string[] {
  const result = [];

  for (const issue of issues) {
    if (issue.path.join(".") === path) {
      result.push(translateIssue(issue)[locale]);
    }
  }

  return result;
}

export interface NestedParams {
  [key: string]: string | NestedParams | undefined;
}

export function getObject(
  params: NestedParams,
  ...path: string[]
): NestedParams | undefined {
  if (path.length === 0) {
    return params;
  }

  let result: NestedParams = params;

  while (path.length > 0) {
    const key = path.pop()!;
    const n = result[key];

    if (typeof n === "object") {
      result = n;
    } else {
      return undefined;
    }
  }

  return result;
}

export function getValue(
  param: NestedParams,
  ...path: string[]
): string | undefined {
  const pathCopy = [...path];

  if (pathCopy.length === 0) {
    throw new Error("path must contain at least one element");
  }

  const lastKey = pathCopy.pop();

  if (lastKey === undefined) {
    return undefined;
  }

  const obj = getObject(param, ...pathCopy);
  if (obj === undefined) {
    return undefined;
  }

  const result = obj[lastKey];
  if (typeof result === "string") {
    return result;
  } else {
    return undefined;
  }
}

export function assertNever(x: never): never {
  throw new Error(`Shouldn't get here, value is ${x} instead of never`);
}

export function assertDefined<T>(x: T | null | undefined): T {
  if (x === null || x === undefined) {
    throw new Error("value not defined");
  } else {
    return x;
  }
}

export function formatTicket(ticket: Ticket, locale: SupportedLocales): string {
  const from = new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
    ticket.from.toUtcDate()
  );
  const to = new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
    ticket.to.toUtcDate()
  );

  return `${from}.–${to}., ${
    translateCategory(ticket.category)[locale]
  }: ${formatCurrency(ticket.price, "EUR", locale)}`;
}

export function paymentReasonForRegistrationCount(count: number): string {
  return `JIF-${101 + count}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatAddress(
  address: Address,
  locale: SupportedLocales
): string {
  let country = address.country;
  try {
    const translatedCountry = new Intl.DisplayNames(locale, {
      type: "region",
    }).of(address.country);
    if (translatedCountry) {
      country = translatedCountry;
    }
  } catch {
    // Ignoring invalid_argument exception when translating country
  }

  return `${address.street}, ${address.postalCode} ${address.city} (${country})`;
}

export const isoDateString = z
  .string()
  .transform((s) => new Date(Date.parse(s)));

export const PaidStatusSchema = z.union([
  z.literal("paid"),
  z.literal("notPaid"),
]);
