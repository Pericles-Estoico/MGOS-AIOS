import type { DefaultSession, DefaultUser } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User extends DefaultUser {
    id: string;
    email: string;
    role: 'admin' | 'executor' | 'viewer' | 'user';
    name?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: 'admin' | 'executor' | 'viewer' | 'user';
      name?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'admin' | 'executor' | 'viewer' | 'user';
  }
}
