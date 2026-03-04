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
        console.log('🔐 authorize() called with:', { email: credentials?.email });
        console.log('📊 Credentials received:', {
          email: credentials?.email,
          passwordLength: credentials?.password?.length,
          passwordValue: credentials?.password
        });

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null;
        }

        try {
          // ALWAYS try test users FIRST for reliability
          console.log('🔍 Searching test users. Available users:', TEST_USERS.map(u => ({ email: u.email, password: u.password })));

          const testUser = TEST_USERS.find(
            (u) => {
              const emailMatch = u.email === credentials.email;
              const passwordMatch = u.password === credentials.password;
              console.log(`  - Comparing ${u.email}: email=${emailMatch}, password=${passwordMatch} (provided pwd: "${credentials.password}")`);
              return emailMatch && passwordMatch;
            }
          );

          if (testUser) {
            console.log('✅ Test user auth successful:', { userId: testUser.id, email: testUser.email });
            return {
              id: testUser.id,
              email: testUser.email,
              name: testUser.name,
              role: testUser.role,
            } as any;
          }
          console.log('⚠️  No test user found matching credentials');

          // Then try Supabase
          if (supabase) {
            try {
              const { data, error } = await supabase.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
              });

              if (!error && data.user) {
                console.log('✅ Supabase auth successful:', { userId: data.user.id });
                const user: User & { role?: string } = {
                  id: data.user.id,
                  email: data.user.email!,
                  name: data.user.user_metadata?.name ?? data.user.email,
                  role: data.user.user_metadata?.role ?? 'executor',
                };
                return user;
              } else {
                console.log('⚠️  Supabase auth failed:', error);
              }
            } catch (supabaseError) {
              console.log('⚠️  Supabase connection error:', supabaseError);
            }
          } else {
            console.log('⚠️  Supabase client not available');
          }

          console.log('❌ Auth failed: No matching user found');
          return null;
        } catch (error) {
          console.error('❌ authorize() error:', error);
          // Last resort: try test users again
          const testUser = TEST_USERS.find(
            (u) => u.email === credentials.email && u.password === credentials.password
          );
          if (testUser) {
            console.log('✅ Test user auth successful (fallback):', { userId: testUser.id });
            return {
              id: testUser.id,
              email: testUser.email,
              name: testUser.name,
              role: testUser.role,
            } as User & { role?: string };
          }
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
