import { createClient } from '@supabase/supabase-js'

const url        = import.meta.env.VITE_SUPABASE_URL
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY   // clé service_role Supabase

/**
 * Client admin avec service_role — bypass RLS.
 * Null si VITE_SUPABASE_SERVICE_KEY n'est pas définie.
 * Dans ce cas, l'AdminScreen génère du SQL à coller manuellement.
 */
export const supabaseAdmin = (url && serviceKey)
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : null
