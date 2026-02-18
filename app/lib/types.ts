import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    role: 'admin' | 'head' | 'executor' | 'qa';
    name?: string;
    image?: string;
    accessToken?: string;
    refreshToken?: string;
  }

  interface Session {
    user: User & {
      id: string;
      role: string;
      accessToken?: string;
    };
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: string;
    accessToken?: string;
    refreshToken?: string;
  }
}

// Type for API responses
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// User role type
export type UserRole = 'admin' | 'head' | 'executor' | 'qa';
