import type { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabase';

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

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null;
        }

        try {
          if (!supabase) {
            console.log('❌ Supabase not configured');
            return null;
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error || !data.user) {
            console.log('❌ Supabase auth error:', error?.message);
            return null;
          }

          console.log('✅ Supabase auth successful:', { userId: data.user.id });
          const user: User & { role?: string } = {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name ?? data.user.email,
            role: data.user.user_metadata?.role ?? 'executor',
          };
          return user;
        } catch (error) {
          console.error('❌ authorize() error:', error);
          return null;
        }
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
        token.sub = user.id;
        token.role = ((user as unknown as Record<string, unknown>).role || 'executor') as 'admin' | 'executor' | 'viewer' | 'user';
      }
      return token;
    },
    session({ session, token }) {
      console.log('📋 session() callback:', { email: session.user?.email, role: token.role });
      if (session.user) {
        session.user.id = (token.sub || '') as string;
        (session.user as unknown as Record<string, unknown>).role = token.role;
      }
      return session;
    },
  },
};
