import { createClient } from '@supabase/supabase-js'

// Vite lee automáticamente estas variables desde Vercel o tu archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("⚠️ ¡Faltan las variables de entorno de Supabase!")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
