import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabaseAdmin } from './supabase';

if (!supabaseAdmin) {
  throw new Error('Supabase admin client not initialized - missing SUPABASE_SERVICE_ROLE_KEY');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'user@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // Validate input
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        if (credentials.password.length < 8) {
          throw new Error('Invalid credentials');
        }

        try {
          // 1. Authenticate with Supabase Auth
          if (!supabaseAdmin) {
            throw new Error('Supabase admin client not initialized');
          }

          const { data, error } = await supabaseAdmin.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error || !data.user) {
            // Generic error message - don't reveal if email exists
            throw new Error('Invalid credentials');
          }

          // 2. Fetch user profile with role from users table
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('id, email, role, name, avatar_url')
            .eq('id', data.user.id)
            .single();

          if (profileError || !profile) {
            // User exists in auth but not in users table - create profile
            await supabaseAdmin
              .from('users')
              .insert({
                id: data.user.id,
                email: data.user.email,
                role: 'executor', // Default role for new users
                name: data.user.user_metadata?.name || null,
              })
              .select()
              .single();

            return {
              id: data.user.id,
              email: data.user.email!,
              role: 'executor',
              name: data.user.user_metadata?.name || undefined,
              image: undefined,
              accessToken: data.session!.access_token,
              refreshToken: data.session!.refresh_token,
            };
          }

          // 3. Return user with all required fields
          return {
            id: data.user.id!,
            email: data.user.email!,
            role: profile.role || 'executor',
            name: profile.name || undefined,
            image: profile.avatar_url || undefined,
            accessToken: data.session!.access_token,
            refreshToken: data.session!.refresh_token,
          };
        } catch (error) {
          // Log actual error server-side
          console.error('Auth error:', error);
          // Return generic error to client
          throw new Error('Invalid credentials');
        }
      },
    }),
  ],

  callbacks: {
    // Add tokens to JWT
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },

    // Add tokens to session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.role = (token.role as 'admin' | 'head' | 'executor' | 'qa') || 'executor';
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET,

  events: {
    async signOut({ token }) {
      // Optional: Log sign out events
      console.log('User signed out:', token.email);
    },
  },
};
