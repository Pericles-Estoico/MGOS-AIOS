import type { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

if (!process.env.NEXTAUTH_SECRET) {
  console.warn('⚠️  NEXTAUTH_SECRET is not set. Using default for development.');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email' },
        password: { label: 'Senha' },
      },
      async authorize(credentials): Promise<User | null> {
        console.log('🔐 authorize() called with:', { email: credentials?.email });

        // Demo credentials - replace with real auth when using Supabase
        if (
          credentials?.email === 'admin@example.com' &&
          credentials?.password === 'password'
        ) {
          console.log('✅ Credentials valid, returning user');
          const user: User & { role?: string } = {
            id: '1',
            email: 'admin@example.com',
            name: 'Demo User',
            role: 'admin',
          };
          return user;
        }

        console.log('❌ Credentials invalid');
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-development-only',
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    jwt({ token, user }) {
      console.log('📝 jwt() callback:', { tokenId: token.sub, userId: user?.id });
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      console.log('📋 session() callback:', { email: session.user?.email, role: token.role });
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};
