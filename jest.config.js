/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["./app/tests/setup.ts"],
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(test).[jt]s?(x)"],
  globals: {
    "ts-jest": {
      // This seems to speed up the tests, see
      // https://stackoverflow.com/a/60905543
      isolatedModules: true,
    },
  },
};
