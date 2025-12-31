/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom';

declare const describe: jest.Describe;
declare const it: jest.It;
declare const test: jest.It;
declare const expect: jest.Expect;
declare const beforeEach: jest.Lifecycle;
declare const afterEach: jest.Lifecycle;
declare const beforeAll: jest.Lifecycle;
declare const afterAll: jest.Lifecycle;
declare const jest: typeof import('jest');

export {};


