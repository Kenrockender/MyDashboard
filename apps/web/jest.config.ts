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

export default createJestConfig(config);
