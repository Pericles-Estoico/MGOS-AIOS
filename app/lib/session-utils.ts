import { Session } from 'next-auth';

export interface AuthenticatedSession extends Session {
  user: Session['user'] & {
    id: string;
    email: string;
  };
}

export function isAuthenticated(session: Session | null): session is AuthenticatedSession {
  return !!session?.user?.id && !!session?.user?.email;
}

export function requireAuth(session: Session | null): AuthenticatedSession {
  if (!isAuthenticated(session)) {
    throw new Error('Not authenticated');
  }
  return session;
}
