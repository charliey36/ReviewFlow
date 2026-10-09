/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    // Mirror the "@/*": ["./src/*"] alias from tsconfig.json
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // The app targets Europe/London for all UK-first date/time behaviour.
  // Pin the test TZ so DD/MM/YYYY and send-window assertions are deterministic
  // regardless of the machine the suite runs on.
  // (set via TZ env in the npm script too, kept here as documentation)
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          // ts-jest needs CommonJS output; the app's tsconfig uses esnext
          // modules for Next.js, which Jest can't run directly.
          module: 'commonjs',
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowJs: true,
        },
      },
    ],
  },
};
