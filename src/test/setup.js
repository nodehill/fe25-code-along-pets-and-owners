// Loaded once by Vitest before any test runs (see vitest.config.js).
//
// 1) Importing this package registers extra "matchers" on `expect` —
//    these are the nice readable assertions we use in tests, e.g.:
//
//      expect(element).toBeInTheDocument()
//      expect(input).toHaveValue('Whiskers')
//
//    Without this line those matchers don't exist and the tests would
//    fail with "expect(...).toBeInTheDocument is not a function".
import '@testing-library/jest-dom/vitest';

// 2) Unmount any component that was rendered during a test, after
//    that test finishes. Without this, components from previous tests
//    are still in the (fake) DOM and queries like screen.getByText
//    find duplicates.
//
//    Note: this happens automatically if you set `globals: true` in
//    vitest.config.js. We don't, because explicit imports in test
//    files are clearer for teaching purposes.
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(cleanup);
