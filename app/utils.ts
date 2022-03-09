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
