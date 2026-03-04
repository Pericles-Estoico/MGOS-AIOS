import type { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@lib/supabase';

if (!process.env.NEXTAUTH_SECRET) {
  console.warn('⚠️  NEXTAUTH_SECRET is not set. Using default for development.');
} else {
  console.log('✅ NEXTAUTH_SECRET is configured');
}

// Version marker for deployment tracking
console.log('🚀 lib/auth.ts loaded - v2.1 with detailed logging');

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
        const startTime = Date.now();
        console.log(`\n[${'='.repeat(60)}]`);
        console.log(`🔐 [${new Date().toISOString()}] authorize() CALLED`);
        console.log(`📝 Credentials type: ${typeof credentials}`);
        console.log(`📝 Credentials keys: ${Object.keys(credentials || {}).join(', ')}`);
        console.log('📊 Credentials received:', {
          email: credentials?.email,
          emailType: typeof credentials?.email,
          emailLength: (credentials?.email as string)?.length,
          password: credentials?.password,
          passwordType: typeof credentials?.password,
          passwordLength: (credentials?.password as string)?.length,
        });

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials - returning null');
          return null;
        }

        try {
          // ALWAYS try test users FIRST for reliability
          console.log(`🔍 TEST_USERS array length: ${TEST_USERS.length}`);
          console.log('🔍 Searching test users. Available users:', TEST_USERS.map(u => ({ email: u.email, pwd_len: u.password.length })));

          const testUser = TEST_USERS.find(
            (u) => {
              const emailMatch = u.email === credentials.email;
              const passwordMatch = u.password === credentials.password;
              const bothMatch = emailMatch && passwordMatch;
              if (bothMatch) {
                console.log(`✅ MATCH FOUND: ${u.email}`);
              } else {
                console.log(`❌ No match for ${u.email}: email_match=${emailMatch} (have:"${credentials.email}" vs want:"${u.email}"), pwd_match=${passwordMatch}`);
              }
              return bothMatch;
            }
          );

          if (testUser) {
            console.log(`✅✅✅ TEST USER AUTH SUCCESSFUL: ${testUser.email} (role: ${testUser.role})`);
            return {
              id: testUser.id,
              email: testUser.email,
              name: testUser.name,
              role: testUser.role,
            } as any;
          }
          console.log('⚠️  No test user found matching credentials in local array');

          // Then try Supabase
          console.log('🔄 Attempting Supabase auth...');
          if (supabase) {
            try {
              console.log(`📡 Calling Supabase signInWithPassword for ${credentials.email}`);
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
                console.log('⚠️  Supabase auth failed:', {
                  errorMessage: error?.message,
                  errorStatus: (error as any)?.status,
                });
              }
            } catch (supabaseError: any) {
              console.log('⚠️  Supabase connection error:', {
                message: supabaseError?.message,
                code: supabaseError?.code,
              });
            }
          } else {
            console.log('⚠️  Supabase client not available');
          }

          console.log('❌ Auth FAILED: No matching user found in TEST_USERS or Supabase');
          console.log(`⏱️  authorize() took ${Date.now() - startTime}ms`);
          console.log(`[${'='.repeat(60)}]\n`);
          return null;
        } catch (error: any) {
          console.error('❌ authorize() EXCEPTION:', {
            message: error?.message,
            code: error?.code,
            stack: error?.stack?.split('\n').slice(0, 3).join(' | '),
          });
          // Last resort: try test users again
          console.log('🔄 FALLBACK: Trying TEST_USERS one more time...');
          const testUser = TEST_USERS.find(
            (u) => u.email === credentials.email && u.password === credentials.password
          );
          if (testUser) {
            console.log('✅✅✅ TEST USER AUTH SUCCESS (FALLBACK):', { userId: testUser.id });
            return {
              id: testUser.id,
              email: testUser.email,
              name: testUser.name,
              role: testUser.role,
            } as User & { role?: string };
          }
          console.log('❌ FALLBACK ALSO FAILED - returning null');
          console.log(`⏱️  authorize() took ${Date.now() - startTime}ms (with exception)`);
          console.log(`[${'='.repeat(60)}]\n`);
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
