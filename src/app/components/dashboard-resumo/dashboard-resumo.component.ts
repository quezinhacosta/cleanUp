import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CleanupService } from '../../services/cleanup.service';
import { EscalaSemana } from '../../models/cleanup.model';

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
            @if (semana.responsaveis && semana.responsaveis.length > 1) {
              <!-- Múltiplos Moradores Escalados (Dupla/Equipe) -->
              <div class="relative flex -space-x-3 overflow-hidden p-1">
                @for (resp of semana.responsaveis; track resp.id; let idx = $index) {
                  <img
                    [src]="resp.avatarUrl || 'https://ui-avatars.com/api/?name=' + resp.nome"
                    [alt]="resp.nome"
                    class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-white border-2 border-slate-100 shadow-md transition-transform hover:scale-105 hover:z-10"
                    [title]="resp.nome"
                  />
                }
              </div>
            } @else if (semana.responsaveis && semana.responsaveis.length === 1) {
              <!-- 1 Único Morador -->
              <div class="relative">
                <img
                  [src]="semana.responsaveis[0].avatarUrl || 'https://ui-avatars.com/api/?name=' + semana.responsaveis[0].nome"
                  [alt]="semana.responsaveis[0].nome"
                  class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-blue-50 border-2 border-white shadow-md"
                />
                <span class="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-lg shadow-sm" title="Responsável da semana">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </span>
              </div>
            } @else {
              <!-- Nenhum Morador Escalado Nesta Semana -->
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 flex flex-col items-center justify-center text-amber-500 shadow-xs">
                <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span class="text-[9px] font-bold uppercase mt-0.5">Vago</span>
              </div>
            }

            <div>
              <div class="flex flex-wrap items-center gap-2 mb-1">
                @if (semana.responsaveis && semana.responsaveis.length > 1) {
                  <span class="text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                    Plantão Compartilhado ({{ semana.responsaveis.length }} moradores)
                  </span>
                } @else if (semana.responsaveis && semana.responsaveis.length === 1) {
                  <span class="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
                    Plantão da Semana
                  </span>
                } @else {
                  <span class="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                    Sem Morador Escalado
                  </span>
                }
                
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
                {{ formatarNomesResponsaveis(semana) }}
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
                  Tudo limpo por aqui!
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
              (click)="service.abrirModalMembros()"
              class="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              Membros ({{ service.moradores().length }})
            </button>
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
    } @else {
      <!-- Estado Vazio: Nenhum membro cadastrado ainda -->
      <div class="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center shadow-xs">
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h3 class="text-base font-bold text-slate-800">Nenhum morador cadastrado</h3>
        <p class="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
          Para ativar o plantão semanal e o rodízio automático das tarefas, cadastre os moradores do apartamento.
        </p>
        <button
          type="button"
          (click)="service.abrirModalMembros()"
          class="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
        >
          <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Cadastrar Moradores
        </button>
      </div>
    }
  `
})
export class DashboardResumoComponent {
  service = inject(CleanupService);

  formatarNomesResponsaveis(semana: EscalaSemana): string {
    const lista = semana.responsaveis || (semana.responsavel ? [semana.responsavel] : []);
    if (lista.length === 0) {
      return 'Nenhum morador escalado';
    }
    if (lista.length === 1) {
      return lista[0].nome;
    }
    if (lista.length === 2) {
      return `${lista[0].nome} & ${lista[1].nome}`;
    }
    return `${lista[0].nome}, ${lista[1].nome} +${lista.length - 2}`;
  }

  formatarPeriodo(inicio: any, fim: any): string {
    const dIniObj = new Date(inicio);
    const dFimObj = new Date(fim);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dIni = `${pad(dIniObj.getDate())}/${pad(dIniObj.getMonth() + 1)}`;
    const dFim = `${pad(dFimObj.getDate())}/${pad(dFimObj.getMonth() + 1)}`;
    return `${dIni} a ${dFim}`;
  }
}
