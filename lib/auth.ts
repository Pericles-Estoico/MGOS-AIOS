import type { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@lib/supabase';

if (!process.env.NEXTAUTH_SECRET) {
  console.warn('⚠️  NEXTAUTH_SECRET is not set. Using default for development.');
} else {
  console.log('✅ NEXTAUTH_SECRET is configured');
}

// Debug environment
console.log('🔐 Auth Config:', {
  hasSecret: !!process.env.NEXTAUTH_SECRET,
  hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasRedisUrl: !!process.env.REDIS_URL,
  nodeEnv: process.env.NODE_ENV,
});

// Test users for development (fallback when Supabase is not available)
const TEST_USERS = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    email: 'admin@empresa.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
  },
  {
    id: '20000000-0000-0000-0000-000000000001',
    email: 'maria@empresa.com',
    password: 'maria123',
    name: 'Maria Silva',
    role: 'head',
  },
  {
    id: '30000000-0000-0000-0000-000000000001',
    email: 'joao@empresa.com',
    password: 'joao123',
    name: 'João Oliveira',
    role: 'executor',
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    email: 'teste@teste.com',
    password: 'teste123',
    name: 'Teste User',
    role: 'executor',
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'pericles@vidadeceo.com.br',
    password: 'Estoico123@',
    name: 'Pericles',
    role: 'admin',
  },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email' },
        password: { label: 'Senha' },
      },
      async authorize(credentials): Promise<User | null> {
        // CRITICAL: Validate credentials immediately
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Seed users — fallback when Supabase auth is unavailable
        const seedUser = TEST_USERS.find(
          (u) => u.email === credentials.email && u.password === credentials.password
        );
        if (seedUser) {
          return {
            id: seedUser.id,
            email: seedUser.email,
            name: seedUser.name,
            role: seedUser.role,
          } as any;
        }

        // Try Supabase auth
        console.log('📡 Attempting Supabase auth for:', credentials.email);

          // Supabase fallback
        if (supabase) {
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: credentials.email,
              password: credentials.password,
            });

            if (!error && data.user) {
              const user: User & { role?: string } = {
                id: data.user.id,
                email: data.user.email!,
                name: data.user.user_metadata?.name ?? data.user.email,
                role: data.user.user_metadata?.role ?? 'executor',
              };
              return user;
            }
          } catch (supabaseError: any) {
            // Supabase error - continue to return null
          }
        }

        // No match found anywhere
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
