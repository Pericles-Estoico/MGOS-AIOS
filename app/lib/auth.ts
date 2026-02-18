import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email' },
        password: { label: 'Senha' },
      },
      async authorize(credentials) {
        return {
          id: '1',
          email: credentials?.email as string,
          name: 'Demo User',
          image: null,
          role: 'user',
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
};
