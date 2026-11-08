import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CleanupService } from '../../services/cleanup.service';
import { AcaoSistema } from '../../models/cleanup.model';

@Component({
  selector: 'app-historico-acoes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 transition-all duration-200 hover:shadow-md">
      
      <!-- Cabeçalho do Card -->
      <div class="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
        <div>
          <div class="flex items-center space-x-2">
            <span class="w-3 h-3 rounded-full bg-violet-600 animate-pulse"></span>
            <h3 class="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Ações no CleanUp
            </h3>
          </div>
          <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registro de alterações cadastrais e do sistema
          </p>
        </div>

        <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
          {{ service.historicoAcoes().length }} ações
        </span>
      </div>

      <!-- Filtros Rápidos por Tipo de Ação -->
      <div class="flex items-center gap-1.5 pb-2.5 border-b border-slate-100 overflow-x-auto no-scrollbar">
        @for (f of ['TODAS', 'ALTERACAO', 'INCLUSAO', 'EXCLUSAO']; track f) {
          <button
            type="button"
            (click)="filtroTipo.set(f)"
            class="px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
            [class.bg-violet-600]="filtroTipo() === f"
            [class.text-white]="filtroTipo() === f"
            [class.shadow-2xs]="filtroTipo() === f"
            [class.bg-slate-100]="filtroTipo() !== f"
            [class.text-slate-600]="filtroTipo() !== f"
            [class.hover:bg-slate-200]="filtroTipo() !== f"
          >
            {{ formatarLabelFiltro(f) }}
          </button>
        }
      </div>

      <!-- Lista de Ações -->
      <div class="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1 mt-1">
        @for (acao of acoesFiltradas(); track acao.id) {
          <div class="py-3 flex items-start space-x-3 group hover:bg-slate-50/80 rounded-xl px-2 transition-colors">
            
            <!-- Ícone do Tipo de Ação -->
            <div
              class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs"
              [class.bg-emerald-100]="acao.tipo === 'INCLUSAO'"
              [class.text-emerald-700]="acao.tipo === 'INCLUSAO'"
              [class.bg-rose-100]="acao.tipo === 'EXCLUSAO'"
              [class.text-rose-700]="acao.tipo === 'EXCLUSAO'"
              [class.bg-blue-100]="acao.tipo === 'ALTERACAO'"
              [class.text-blue-700]="acao.tipo === 'ALTERACAO'"
              [class.bg-slate-100]="acao.tipo === 'SISTEMA'"
              [class.text-slate-700]="acao.tipo === 'SISTEMA'"
            >
              @switch (acao.tipo) {
                @case ('INCLUSAO') {
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                }
                @case ('EXCLUSAO') {
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                }
                @case ('ALTERACAO') {
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                }
                @default {
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              }
            </div>

            <!-- Conteúdo da Ação (Sem data e hora, apenas o log) -->
            <div class="flex-1 min-w-0">
              <p class="text-sm sm:text-base font-semibold text-slate-800 leading-snug">
                {{ acao.descricao }}
              </p>
              
              <div class="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <span class="inline-flex items-center text-slate-600 font-medium">
                  <svg class="w-3 h-3 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {{ acao.autorNome || 'CleanUp' }}
                </span>
                <span class="text-slate-300">&bull;</span>
                <span
                  class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded"
                  [class.text-emerald-700]="acao.tipo === 'INCLUSAO'"
                  [class.bg-emerald-50]="acao.tipo === 'INCLUSAO'"
                  [class.text-rose-700]="acao.tipo === 'EXCLUSAO'"
                  [class.bg-rose-50]="acao.tipo === 'EXCLUSAO'"
                  [class.text-blue-700]="acao.tipo === 'ALTERACAO'"
                  [class.bg-blue-50]="acao.tipo === 'ALTERACAO'"
                  [class.text-slate-600]="acao.tipo === 'SISTEMA'"
                  [class.bg-slate-100]="acao.tipo === 'SISTEMA'"
                >
                  {{ acao.tipo }}
                </span>
              </div>
            </div>

          </div>
        } @empty {
          <div class="py-8 text-center text-slate-400">
            <svg class="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p class="text-sm font-semibold text-slate-600">Nenhuma ação registrada.</p>
            <p class="text-xs text-slate-400 mt-0.5">As alterações cadastrais aparecerão aqui em tempo real.</p>
          </div>
        }
      </div>

    </div>
  `
})
export class HistoricoAcoesComponent {
  service = inject(CleanupService);

  filtroTipo = signal<string>('TODAS');

  acoesFiltradas = computed<AcaoSistema[]>(() => {
    const todas = this.service.historicoAcoes();
    const filtro = this.filtroTipo();
    if (filtro === 'TODAS' || filtro === 'TODOS') return todas;
    if (filtro === 'ALTERACAO') {
      return todas.filter(a => a.tipo === 'ALTERACAO' || a.tipo === 'SISTEMA');
    }
    return todas.filter(a => a.tipo === filtro);
  });

  formatarLabelFiltro(tipo: string): string {
    switch (tipo) {
      case 'INCLUSAO': return 'Inclusões';
      case 'EXCLUSAO': return 'Exclusões';
      case 'ALTERACAO': return 'Alterações';
      case 'TODAS':
      case 'TODOS':
      default: return 'Todas';
    }
  }
}
