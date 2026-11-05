import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment, SUPABASE_URL, SUPABASE_ANON_KEY } from '../environemts/environemts';

/**
 * Normaliza a URL do Supabase removendo '/rest/v1' se presente,
 * já que o cliente @supabase/supabase-js gerencia os endpoints automaticamente.
 */
const rawUrl = environment?.supabaseUrl || SUPABASE_URL || '';
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
export const supabaseAnonKey = environment?.supabaseAnonKey || SUPABASE_ANON_KEY || '';

/**
 * Instância principal do cliente Supabase para o CleanUp.
 * Suporta operações de Banco de Dados, Autenticação e Realtime (WebSockets)
 * para sincronização ao vivo entre usuários no deploy da Vercel.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export default supabase;

