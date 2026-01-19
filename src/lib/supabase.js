import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const isBrowser = typeof window !== 'undefined'
const rememberMeKey = 'heliodesk_remember_me'

const authStorage = {
  getItem: (key) => {
    if (!isBrowser) return null
    const remember = window.localStorage.getItem(rememberMeKey) === 'true'
    const storage = remember ? window.localStorage : window.sessionStorage
    return storage.getItem(key)
  },
  setItem: (key, value) => {
    if (!isBrowser) return
    const remember = window.localStorage.getItem(rememberMeKey) === 'true'
    const storage = remember ? window.localStorage : window.sessionStorage
    storage.setItem(key, value)
  },
  removeItem: (key) => {
    if (!isBrowser) return
    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  },
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        storage: authStorage,
      },
    })
  : null
