const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Путь к Next.js приложению для загрузки next.config.js и .env файлов
  dir: './',
});

// Кастомная конфигурация Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/app/**',
    '!src/lib/seo/**',
  ],
  testMatch: [
    '**/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '**/__tests__/**/*.spec.{js,jsx,ts,tsx}',
    '**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/dist/', '.*\\.d\\.ts$'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@radix-ui|lucide-react|date-fns|react-day-picker|embla-carousel-react|cmdk|input-otp|vaul|sonner|recharts)/)',
  ],
};

module.exports = createJestConfig(customJestConfig);
