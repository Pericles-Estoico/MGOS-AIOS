/**
 * NextAuth Integration Tests
 * Story 1.5: Testing authentication flow
 */

import { authOptions } from '@/lib/auth';
import CredentialsProvider from 'next-auth/providers/credentials';

describe('NextAuth Configuration', () => {
  it('should have authOptions configured', () => {
    expect(authOptions).toBeDefined();
    expect(authOptions.providers).toBeDefined();
    expect(authOptions.providers.length).toBeGreaterThan(0);
  });

  it('should use JWT session strategy', () => {
    expect(authOptions.session?.strategy).toBe('jwt');
  });

  it('should have 24-hour token expiration', () => {
    expect(authOptions.session?.maxAge).toBe(24 * 60 * 60);
    expect(authOptions.jwt?.maxAge).toBe(24 * 60 * 60);
  });

  it('should have CredentialsProvider configured', () => {
    const hasCredentialsProvider = authOptions.providers.some(
      (provider) => provider.id === 'credentials'
    );
    expect(hasCredentialsProvider).toBe(true);
  });

  it('should have NEXTAUTH_SECRET configured', () => {
    expect(authOptions.secret).toBeDefined();
    expect(process.env.NEXTAUTH_SECRET).toBeDefined();
  });

  it('should redirect to /login on sign in', () => {
    expect(authOptions.pages?.signIn).toBe('/login');
  });

  it('should have JWT callbacks', () => {
    expect(authOptions.callbacks?.jwt).toBeDefined();
    expect(authOptions.callbacks?.session).toBeDefined();
  });
});

describe('JWT Callbacks', () => {
  it('should add user data to token', async () => {
    const jwt = authOptions.callbacks?.jwt;
    if (!jwt) throw new Error('JWT callback not defined');

    const result = await jwt({
      token: { sub: 'test-id' },
      user: {
        id: 'test-id',
        email: 'test@example.com',
        role: 'executor',
        name: 'Test User',
        accessToken: 'test-token',
      },
    } as any);

    expect(result.id).toBe('test-id');
    expect(result.role).toBe('executor');
    expect(result.accessToken).toBe('test-token');
  });
});

describe('Session Callbacks', () => {
  it('should add user data to session', async () => {
    const session = authOptions.callbacks?.session;
    if (!session) throw new Error('Session callback not defined');

    const result = await session({
      session: {
        user: { id: '', email: '' },
        expires: new Date().toISOString(),
      },
      token: {
        sub: 'test-id',
        id: 'test-id',
        email: 'test@example.com',
        role: 'head',
        accessToken: 'test-token',
      } as any,
    } as any);

    expect(result.user.id).toBe('test-id');
    expect(result.user.role).toBe('head');
    expect(result.accessToken).toBe('test-token');
  });
});

describe('Password Validation', () => {
  it('should require minimum 8 character password', async () => {
    const authorize = (authOptions.providers[0] as any)?.authorize;
    if (!authorize) throw new Error('Authorize method not found');

    expect(async () => {
      await authorize(
        { email: 'test@example.com', password: 'short' },
        {}
      );
    }).rejects.toThrow();
  });

  it('should require both email and password', async () => {
    const authorize = (authOptions.providers[0] as any)?.authorize;
    if (!authorize) throw new Error('Authorize method not found');

    expect(async () => {
      await authorize({ email: 'test@example.com', password: '' }, {});
    }).rejects.toThrow();
  });
});
