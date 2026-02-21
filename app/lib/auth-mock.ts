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

export const authOptions: any = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials, req) {
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
            role: mockUser.role as any,
          };
        }

        // Allow any other email for testing
        return {
          id: '1',
          email: credentials.email,
          name: credentials.email.split('@')[0],
          role: 'user' as any,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = ((user as unknown as Record<string, unknown>).role || 'user') as any;
      }
      return token;
    },
    async session({ session, token }: any) {
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
