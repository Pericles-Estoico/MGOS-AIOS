import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Mock user database
const mockUsers = {
  'teste@teste.com': {
    id: '1',
    email: 'teste@teste.com',
    name: 'Testador',
    role: 'admin',
    password: 'teste123', // Mock: any password accepted
  },
};

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        // Mock: accept any email/password combination
        if (!credentials?.email) {
          return null;
        }

        // For demo, return the mock user or create on the fly
        const mockUser = mockUsers['teste@teste.com'];
        if (mockUser && credentials.email === mockUser.email) {
          return {
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role,
          };
        }

        // Allow any other email for testing
        return {
          id: '1',
          email: credentials.email,
          name: credentials.email.split('@')[0],
          role: 'user',
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as unknown as Record<string, unknown>).role || 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email;
        session.user.name = token.name;
        (session.user as unknown as Record<string, unknown>).role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
    },
  },
};
