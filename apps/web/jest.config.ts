import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

// Default environment is 'node' — most of this suite is services, pure
// functions, and route handlers, none of which touch the DOM. Component
// tests opt into jsdom individually via a `/** @jest-environment jsdom */`
// docblock at the top of the file, rather than paying jsdom's setup cost
// (and risking DOM globals leaking into route/service tests) globally.
const config: Config = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

// The @react-pdf/* chain is ESM-only, so Jest has to transform it rather than
// ignore it like the rest of node_modules. next/jest normally derives that
// from `transpilePackages`, but react-pdf can't be listed there — bundling it
// into the server graph is exactly what breaks PDF rendering at runtime (see
// the comment in next.config.ts). next/jest only ever *appends* user patterns
// to its own hardcoded `/node_modules/`, and appending can't un-ignore, so the
// resolved config is rewritten here instead.
const ESM_PACKAGES = ['@react-pdf', 'yoga-layout', 'color-string', 'color-name'];

export default async function jestConfig(): Promise<Config> {
  const resolved = await createJestConfig(config)();
  return {
    ...resolved,
    transformIgnorePatterns: [
      `/node_modules/(?!(${ESM_PACKAGES.join('|')})/)`,
      '^.+\\.module\\.(css|sass|scss)$',
    ],
  };
}
