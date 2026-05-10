import { createClient } from '@supabase/supabase-js'

// Build time detection
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'
const isServer = typeof window === 'undefined'

// Safe environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Build time এ dummy client তৈরি করুন
let supabaseClient: any

if (isBuildTime && isServer) {
  // Build time এর জন্য dummy client
  supabaseClient = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: async () => ({ data: [], error: null }),
          single: async () => ({ data: null, error: null }),
        }),
        insert: async () => ({ data: null, error: null }),
        update: async () => ({ data: null, error: null }),
        delete: async () => ({ data: null, error: null }),
      }),
    }),
  }
} else {
  // Runtime এর জন্য real client
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: typeof window !== 'undefined',
    },
  })
}

export const supabase = supabaseClient