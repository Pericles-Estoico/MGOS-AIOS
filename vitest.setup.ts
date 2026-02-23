/**
 * @file vitest.setup.ts
 * @description Global setup for all Vitest tests
 */

import { expect, afterEach, vi } from 'vitest';

// ============================================================================
// Global Setup
// ============================================================================

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret-key';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// ============================================================================
// Mock Modules
// ============================================================================

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => Promise.resolve(null))
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/'
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: () => ({
    get: vi.fn()
  })
}));

// ============================================================================
// Global Test Utilities
// ============================================================================

// Mock Supabase client
export const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  then: vi.fn()
};

// Mock fetch globally
global.fetch = vi.fn();

// ============================================================================
// Custom Matchers (if needed)
// ============================================================================

expect.extend({
  toBeValidUUID(received: string) {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidPattern.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid UUID`
          : `expected ${received} to be a valid UUID`
    };
  }
});

// ============================================================================
// Cleanup After Each Test
// ============================================================================

afterEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// Error Handling
// ============================================================================

// Suppress console errors in tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn((...args) => {
    // Filter out known errors or keep the original
    if (
      args[0]?.includes?.('Warning: ReactDOM.render') ||
      args[0]?.includes?.('Not implemented: HTMLFormElement')
    ) {
      return;
    }
    originalError.call(console, ...args);
  });
});

afterAll(() => {
  console.error = originalError;
});
