import 'next-auth';
import 'next-auth/jwt';

export type UserRole = 'admin' | 'head' | 'executor' | 'qa';

declare module 'next-auth' {
  interface User {
    id: string;
    email?: string | null;
    role?: UserRole;
    name?: string | null;
    image?: string | null;
    accessToken?: string;
    refreshToken?: string;
  }

  interface Session {
    user: User & {
      id: string;
      role?: UserRole;
      accessToken?: string;
    };
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email?: string | null;
    role?: UserRole;
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
