import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _supabaseClient: SupabaseClient | null | undefined;
let _supabaseAdminClient: SupabaseClient | null | undefined;

// Lazy-load client to avoid initialization errors during build
function getSupabaseClient(): SupabaseClient | null {
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

function getSupabaseAdminClient(): SupabaseClient | null {
  if (_supabaseAdminClient !== undefined) {
    return _supabaseAdminClient;
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    _supabaseAdminClient = null;
    return null;
  }

  _supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  return _supabaseAdminClient;
}

// Client for frontend (uses anon key - respects RLS)
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabaseClient();
    if (!client) {
      console.warn('⚠️  Supabase client not initialized');
      return undefined;
    }
    return (client as any)[prop];
  },
});

// Server-side admin client (uses service role - bypasses RLS)
export const supabaseAdmin = new Proxy({} as SupabaseClient | null, {
  get: (target, prop) => {
    const client = getSupabaseAdminClient();
    if (!client) return undefined;
    return (client as any)[prop];
  },
});

// Create server client with optional access token
export function createSupabaseServerClient(accessToken?: string): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Supabase environment variables not configured');
    return null;
  }

  const options = accessToken
    ? {
        auth: { persistSession: false },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    : {
        auth: { persistSession: false },
      };

  return createClient(supabaseUrl, supabaseAnonKey, options as any);
}
