import { createClient } from '@supabase/supabase-js'

// Safe environment variables with defaults for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// Detect if we're in build time
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'

// Create a safe client that won't throw errors during build
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: typeof window !== 'undefined',
    detectSessionInUrl: typeof window !== 'undefined',
  },
  // Don't throw errors during build time
  global: {
    fetch: isBuildTime 
      ? (async () => new Response()) as typeof fetch
      : undefined,
  },
})