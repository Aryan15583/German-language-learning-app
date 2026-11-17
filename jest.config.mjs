import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const base = createJestConfig({
  // Logic tests run in Node; component tests opt into jsdom with a @jest-environment docblock.
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
});

// next/jest replaces transformIgnorePatterns, so set it afterwards:
// the @noble crypto libraries ship as ES modules and must be transformed.
const config = async () => {
  const c = await base();
  c.transformIgnorePatterns = ["/node_modules/(?!(@noble)/)", "^.+\\.module\\.(css|sass|scss)$"];
  return c;
};

export default config;
