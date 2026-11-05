import { Injectable, signal } from '@angular/core';
import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabaseclient';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  /**
   * Instância principal do cliente Supabase para consultas e operações
   */
  readonly client: SupabaseClient = supabase;

  /**
   * Estado reativo da conexão com o backend do Supabase
   */
  readonly statusConexao = signal<'CONECTANDO' | 'ONLINE' | 'OFFLINE'>('CONECTANDO');

  /**
   * Canal ativo de WebSockets Realtime
   */
  private canalRealtime: RealtimeChannel | null = null;

  constructor() {
    this.verificarConexao();
  }

  /**
   * Testa a conectividade com o Supabase
   */
  async verificarConexao(): Promise<boolean> {
    try {
      // Faz uma verificação leve no servidor do Supabase
      const { error } = await this.client.from('tarefas').select('id').limit(1);
      
      // Se a tabela ainda não existir no Supabase, o status HTTP ainda indica conexão estabelecida
      if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
        // Erro de rede ou chave inválida
        if (error.message?.includes('FetchError') || error.message?.includes('Failed to fetch')) {
          this.statusConexao.set('OFFLINE');
          return false;
        }
      }

      this.statusConexao.set('ONLINE');
      return true;
    } catch {
      this.statusConexao.set('OFFLINE');
      return false;
    }
  }

  /**
   * Conecta a um canal Realtime para escutar alterações de todas as tabelas em tempo real
   */
  iniciarCanalRealtime(aoReceberAlteracao: (payload: any) => void): RealtimeChannel {
    if (this.canalRealtime) {
      return this.canalRealtime;
    }

    this.canalRealtime = this.client
      .channel('cleanup-public-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          aoReceberAlteracao(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.statusConexao.set('ONLINE');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.statusConexao.set('OFFLINE');
        }
      });

    return this.canalRealtime;
  }

  /**
   * Encerra o canal Realtime ao destruir
   */
  encerrarCanalRealtime(): void {
    if (this.canalRealtime) {
      this.client.removeChannel(this.canalRealtime);
      this.canalRealtime = null;
    }
  }
}

