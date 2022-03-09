import { parseFormData } from "../utils";

test("parseFormData flat", () => {
  const formData = new FormData();
  formData.append("foo", "2");
  formData.append("foo", "3");
  formData.append("bar", "baz");

  const result = parseFormData(formData);

  expect(result.foo).toBe("3");
  expect(result.bar).toBe("baz");
});

test("parseFormData without arrays", () => {
  const formData = new FormData();
  formData.append("foo", "2");
  formData.append("foo.bar", "2");
  formData.append("foo.baz", "baz");

  const result = parseFormData(formData);

  // @ts-ignore
  expect(result.foo.bar).toBe("2");
  // @ts-ignore
  expect(result.foo.baz).toBe("baz");
});

test("parseFormData with arrays", () => {
  const formData = new FormData();
  formData.append("foo.0.bar", "2");
  formData.append("foo.1.bar", "baz");

  const result = parseFormData(formData);

  // @ts-ignore
  expect(result.foo[0].bar).toBe("2");
  // @ts-ignore
  expect(result.foo[1].bar).toBe("baz");
  expect(Array.isArray(result.foo)).toBeTruthy();
});
