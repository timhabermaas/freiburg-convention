import { z } from "zod";

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

export function errorsForPath(path: string, issues: z.ZodIssue[]): string[] {
  const result = [];

  for (const issue of issues) {
    if (issue.path.join(".") === path) {
      result.push(issue.message + " " + issue.code);
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
  throw new Error("Shouldn't get here, value is ${x} instead of never");
}
