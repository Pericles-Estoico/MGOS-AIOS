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
  'pericles@vidadeceo.com.br': {
    id: '2',
    email: 'pericles@vidadeceo.com.br',
    name: 'Pericles Estoico',
    role: 'admin',
    password: 'Estoico123@',
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
        // Check if email is in mock users
        if (!credentials?.email) {
          return null;
        }

        const mockUser = mockUsers[credentials.email as keyof typeof mockUsers];

        if (mockUser) {
          // Check password if it exists
          if (mockUser.password && credentials.password !== mockUser.password) {
            console.log('❌ Invalid password for', credentials.email);
            return null;
          }
          return {
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role as any,
          };
        }

        // Allow any other email for testing with any password
        return {
          id: Math.random().toString(36).substr(2, 9),
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
