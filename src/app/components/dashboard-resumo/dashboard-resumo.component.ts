import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CleanupService } from '../../services/cleanup.service';

@Component({
  selector: 'app-dashboard-resumo',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (service.semanaAtual(); as semana) {
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-7 relative overflow-hidden transition-all duration-200 hover:shadow-md">
        
        <!-- Gradient Accent Bar -->
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400"></div>

        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <!-- Lado Esquerdo: Responsável da Semana & Ciclo -->
          <div class="flex items-start sm:items-center gap-4 sm:gap-5">
            <div class="relative">
              <img
                [src]="semana.responsavel.avatarUrl || 'https://ui-avatars.com/api/?name=' + semana.responsavel.nome"
                [alt]="semana.responsavel.nome"
                class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-blue-50 border-2 border-white shadow-md"
              />
              <span class="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-lg shadow-sm" title="Responsável da semana">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </span>
            </div>

            <div>
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span class="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
                  Plantão da Semana
                </span>
                
                <!-- Status Badge -->
                @switch (semana.status) {
                  @case ('CONCLUIDO') {
                    <span class="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                      Ciclo Concluído
                    </span>
                  }
                  @case ('EM_ANDAMENTO') {
                    <span class="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      <span class="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5 animate-pulse"></span>
                      Em Andamento
                    </span>
                  }
                  @default {
                    <span class="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Pendente
                    </span>
                  }
                }
              </div>

              <h2 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {{ semana.responsavel.nome }}
              </h2>

              <p class="text-xs sm:text-sm text-slate-500 flex items-center mt-0.5">
                <svg class="w-4 h-4 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Período: <span class="font-medium text-slate-700 ml-1">{{ formatarPeriodo(semana.dataInicio, semana.dataFim) }}</span>
              </p>
            </div>
          </div>

          <!-- Lado Direito: Barra de Progresso e Métricas -->
          <div class="flex-1 lg:max-w-md w-full bg-slate-50/80 rounded-xl p-4 border border-slate-100">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Progresso das Tarefas
              </span>
              <span class="text-sm font-bold" [class.text-emerald-600]="service.progressoSemana().porcentagem === 100" [class.text-blue-600]="service.progressoSemana().porcentagem < 100">
                {{ service.progressoSemana().porcentagem }}%
              </span>
            </div>

            <!-- Visual Progress Bar -->
            <div class="w-full bg-slate-200 rounded-full h-3 overflow-hidden p-0.5">
              <div
                class="h-full rounded-full transition-all duration-500 ease-out"
                [class.bg-emerald-500]="service.progressoSemana().porcentagem === 100"
                [class.bg-gradient-to-r]="service.progressoSemana().porcentagem < 100"
                [class.from-blue-600]="service.progressoSemana().porcentagem < 100"
                [class.to-indigo-500]="service.progressoSemana().porcentagem < 100"
                [style.width.%]="service.progressoSemana().porcentagem"
              ></div>
            </div>

            <div class="flex items-center justify-between text-xs text-slate-500 mt-2.5">
              <span>
                <strong class="text-slate-800 font-semibold">{{ service.progressoSemana().concluidas }}</strong> de {{ service.progressoSemana().total }} concluídas
              </span>
              @if (service.progressoSemana().porcentagem === 100) {
                <span class="text-emerald-600 font-medium flex items-center">
                  Tudo limpo por aqui! ✨
                </span>
              } @else {
                <span class="text-slate-500">
                  {{ service.progressoSemana().total - service.progressoSemana().concluidas }} restantes
                </span>
              }
            </div>
          </div>

        </div>

        <!-- Footer Actions Bar -->
        <div class="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex items-center text-slate-500">
            <svg class="w-4 h-4 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Dica: Marque as tarefas no checklist para alimentar o log de auditoria em tempo real.
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="service.reiniciarCicloSemanal()"
              class="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-slate-200"
              title="Zerar tarefas do ciclo atual"
            >
              Reiniciar Ciclo
            </button>
            <button
              type="button"
              (click)="service.avancarSemana()"
              class="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium shadow-xs transition-colors"
              title="Avançar para o próximo morador da escala"
            >
              Avançar Rodízio
              <svg class="w-3.5 h-3.5 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    }
  `
})
export class DashboardResumoComponent {
  service = inject(CleanupService);

  formatarPeriodo(inicio: Date, fim: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dIni = `${pad(inicio.getDate())}/${pad(inicio.getMonth() + 1)}`;
    const dFim = `${pad(fim.getDate())}/${pad(fim.getMonth() + 1)}`;
    return `${dIni} a ${dFim}`;
  }
}

