/**
 * Supabase client utilities
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let _supabaseClient: SupabaseClient | null | undefined;
let _supabaseAdminClient: SupabaseClient | null | undefined;

/**
 * Create Supabase server client with service role key (for admin operations)
 */
export function createSupabaseServerClient(accessToken?: string): SupabaseClient | null {
  if (_supabaseAdminClient !== undefined) {
    return _supabaseAdminClient;
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️  Supabase service key not configured');
    _supabaseAdminClient = null;
    return null;
  }

  _supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });

  return _supabaseAdminClient;
}

/**
 * Create Supabase client for browser (anon key)
 */
export function createSupabaseClient(): SupabaseClient | null {
  if (_supabaseClient !== undefined) {
    return _supabaseClient;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Supabase environment variables not configured');
    _supabaseClient = null;
    return null;
  }

  _supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });

  return _supabaseClient;
}

/**
 * Get Supabase client (server or browser)
 */
export function getSupabaseClient(isServer = false): SupabaseClient | null {
  if (isServer) {
    return createSupabaseServerClient();
  }
  return createSupabaseClient();
}

/**
 * Default client instance (browser/anon)
 */
export const supabase = createSupabaseClient();
