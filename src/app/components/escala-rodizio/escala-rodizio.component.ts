import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CleanupService } from '../../services/cleanup.service';
import { EscalaSemana, Morador } from '../../models/cleanup.model';

@Component({
  selector: 'app-escala-rodizio',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 transition-all duration-200 hover:shadow-md">
      
      <!-- Cabeçalho Principal da Escala -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div class="flex items-center space-x-2">
            <h3 class="text-lg font-bold text-slate-900 tracking-tight flex items-center">
              <span class="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></span>
              Visão da Escala de Rodízio
            </h3>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Calendário Mensal
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            Navegue pelos meses, visualize o calendário e arraste os moradores entre as semanas com total flexibilidade.
          </p>
        </div>

        <!-- Indicador de Status Rápido -->
        @if (service.moradores().length > 0) {
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <span class="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
              {{ service.moradores().length }} moradores ativos
            </span>
          </div>
        }
      </div>

      @if (service.moradores().length > 0) {
        <!-- Barra de Navegação do Mês e Ações da Escala -->
        <div class="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/20 to-blue-50/30 border border-slate-200/80">
          
          <!-- Seletor do Mês / Ano -->
          <div class="flex items-center gap-2">
            <div class="flex items-center bg-white border border-slate-200 shadow-xs rounded-xl p-1">
              <button
                type="button"
                (click)="voltarMes()"
                class="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Mês anterior"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div class="px-3 sm:px-4 py-1 flex items-center gap-2 min-w-[170px] sm:min-w-[190px] justify-center select-none">
                <svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="text-sm font-bold text-slate-800 tracking-tight capitalize">
                  {{ nomeDoMes(service.mesVisualizacao().mes) }} {{ service.mesVisualizacao().ano }}
                </span>
                @if (isMesAtual()) {
                  <span class="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Atual
                  </span>
                }
              </div>

              <button
                type="button"
                (click)="avancarMes()"
                class="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Próximo mês"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            @if (!isMesAtual()) {
              <button
                type="button"
                (click)="irParaMesAtual()"
                class="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 px-3 py-2 rounded-xl border border-blue-200 shadow-xs transition-colors"
                title="Voltar para o mês corrente"
              >
                Mês Atual
              </button>
            }
          </div>

          <!-- Botões de Ação do Mês -->
          <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <!-- Alternar Visão Calendário -->
            <button
              type="button"
              (click)="alternarVisualizacaoCalendario()"
              class="flex-1 sm:flex-none inline-flex items-center justify-center text-xs font-semibold px-3 py-2 rounded-xl border transition-all"
              [class.bg-indigo-600]="exibirCalendarioMensal()"
              [class.text-white]="exibirCalendarioMensal()"
              [class.border-indigo-600]="exibirCalendarioMensal()"
              [class.shadow-xs]="exibirCalendarioMensal()"
              [class.bg-white]="!exibirCalendarioMensal()"
              [class.text-slate-700]="!exibirCalendarioMensal()"
              [class.border-slate-200]="!exibirCalendarioMensal()"
            >
              <svg class="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{{ exibirCalendarioMensal() ? 'Ocultar Calendário' : 'Ver Calendário' }}</span>
            </button>

            <!-- Equilibrar Rodízio do Mês -->
            <button
              type="button"
              (click)="equilibrarMes()"
              class="flex-1 sm:flex-none inline-flex items-center justify-center text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shadow-xs transition-colors"
              title="Distribuir moradores automaticamente em ciclo rotativo neste mês"
            >
              <svg class="w-3.5 h-3.5 mr-1.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Equilibrar Mês</span>
            </button>

            <!-- Adicionar Semana Extra -->
            <button
              type="button"
              (click)="adicionarSemanaNoMes()"
              class="flex-1 sm:flex-none inline-flex items-center justify-center text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl border border-blue-200 shadow-xs transition-colors"
              title="Adicionar mais uma semana a este mês"
            >
              <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Nova Semana</span>
            </button>
          </div>

        </div>

        <!-- Mini Calendário Visual Mensal (Expansível) -->
        @if (exibirCalendarioMensal()) {
          <div class="mt-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs transition-all">
            <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span class="text-sm">🗓️</span> Calendário de {{ nomeDoMes(service.mesVisualizacao().mes) }} de {{ service.mesVisualizacao().ano }}
              </span>
              <span class="text-[11px] text-slate-400 hidden sm:inline">
                Passe o mouse ou clique em qualquer dia para localizar a semana correspondente
              </span>
            </div>

            <!-- Cabeçalho dos Dias da Semana -->
            <div class="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-1.5">
              @for (diaNome of ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']; track diaNome) {
                <div class="text-[11px] font-bold text-slate-400 py-1 uppercase tracking-wider">
                  {{ diaNome }}
                </div>
              }
            </div>

            <!-- Grade de Dias do Mês -->
            <div class="grid grid-cols-7 gap-1 sm:gap-2">
              @for (celula of celulasCalendario(); track celula.id) {
                <div
                  (click)="selecionarSemana(celula.semanaId)"
                  class="min-h-[54px] sm:min-h-[62px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group/dia"
                  [class.bg-blue-50]="celula.isHoje"
                  [class.border-blue-400]="celula.isHoje"
                  [class.ring-2]="celula.isHoje"
                  [class.ring-blue-300]="celula.isHoje"
                  [class.bg-white]="!celula.isHoje && celula.doMesAtual"
                  [class.border-slate-200]="!celula.isHoje && celula.doMesAtual"
                  [class.hover:border-indigo-400]="celula.doMesAtual"
                  [class.hover:shadow-xs]="celula.doMesAtual"
                  [class.bg-slate-50/50]="!celula.doMesAtual"
                  [class.border-slate-100]="!celula.doMesAtual"
                  [class.opacity-35]="!celula.doMesAtual"
                  [title]="celula.doMesAtual && celula.moradores.length > 0 ? 'Plantão: ' + formatarNomes(celula.moradores) : ''"
                >
                  <div class="flex items-center justify-between">
                    <span
                      class="text-xs font-bold leading-none"
                      [class.text-blue-700]="celula.isHoje"
                      [class.text-slate-800]="!celula.isHoje && celula.doMesAtual"
                      [class.text-slate-400]="!celula.doMesAtual"
                    >
                      {{ celula.dia }}
                    </span>
                    @if (celula.isHoje) {
                      <span class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" title="Hoje"></span>
                    }
                  </div>

                  <!-- Mini Avatares dos Moradores Escalados neste dia -->
                  @if (celula.moradores && celula.moradores.length > 0) {
                    <div class="flex -space-x-1.5 overflow-hidden mt-1">
                      @for (m of celula.moradores; track m.id) {
                        <img
                          [src]="m.avatarUrl || 'https://ui-avatars.com/api/?name=' + m.nome"
                          [alt]="m.nome"
                          class="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-white ring-1 ring-slate-100"
                          [title]="m.nome"
                        />
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- Faixa / Bancada de Moradores Disponíveis para Arrastar -->
        <div class="mt-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <span class="text-xs font-bold text-slate-700 flex items-center">
              <svg class="w-4 h-4 mr-1.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
              </svg>
              Moradores (arraste para qualquer semana de {{ nomeDoMes(service.mesVisualizacao().mes) }}):
            </span>
            <span class="text-[11px] text-slate-500">
              O número ao lado indica quantas semanas cada morador está escalado neste mês
            </span>
          </div>

          <div class="flex flex-wrap gap-2 items-center">
            @for (m of service.moradores(); track m.id) {
              <div
                draggable="true"
                (dragstart)="aoIniciarArrasto($event, m.id, null)"
                (dragend)="aoFinalizarArrasto()"
                class="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-sm transition-all select-none group"
                [title]="'Arraste ' + m.nome + ' para uma semana de ' + nomeDoMes(service.mesVisualizacao().mes)"
              >
                <!-- Drag Handle Dots -->
                <span class="text-slate-300 group-hover:text-blue-500 transition-colors">
                  <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 4a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0zM7 16a2 2 0 11-4 0 2 2 0 014 0zM17 4a2 2 0 11-4 0 2 2 0 014 0zM17 10a2 2 0 11-4 0 2 2 0 014 0zM17 16a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
                <img
                  [src]="m.avatarUrl || 'https://ui-avatars.com/api/?name=' + m.nome"
                  [alt]="m.nome"
                  class="w-6 h-6 rounded-full object-cover border border-slate-200"
                />
                <span class="text-xs font-semibold text-slate-800">{{ m.nome }}</span>
                <span
                  class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60"
                  title="Semanas escalado(a) neste mês"
                >
                  {{ contarSemanasDoMoradorNoMes(m.id) }}
                </span>
              </div>
            }

            <button
              type="button"
              (click)="service.abrirModalMembros()"
              class="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 border border-dashed border-blue-300 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              + Novo Membro
            </button>
          </div>
        </div>

        <!-- Grid de Semanas da Escala do Mês Selecionado (Drop Zones) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 mt-5">
          @for (semana of semanasExibidas(); track semana.semanaId; let i = $index) {
            <div
              [id]="'card-semana-' + semana.semanaId"
              (dragover)="aoArrastarSobre($event, semana.semanaId)"
              (dragenter)="aoEntrarNaZona($event, semana.semanaId)"
              (dragleave)="aoSairDaZona($event, semana.semanaId)"
              (drop)="aoSoltar($event, semana.semanaId)"
              class="rounded-2xl border p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between relative group min-h-[235px]"
              [class.border-blue-500]="semanaHover() === semana.semanaId"
              [class.bg-blue-50/70]="semanaHover() === semana.semanaId"
              [class.ring-2]="semanaHover() === semana.semanaId"
              [class.ring-blue-400]="semanaHover() === semana.semanaId"
              [class.shadow-md]="semanaHover() === semana.semanaId"
              [class.border-blue-300]="semanaHover() !== semana.semanaId && isSemanaAtual(semana)"
              [class.bg-blue-50/20]="semanaHover() !== semana.semanaId && isSemanaAtual(semana)"
              [class.shadow-xs]="isSemanaAtual(semana)"
              [class.border-slate-200]="semanaHover() !== semana.semanaId && !isSemanaAtual(semana)"
              [class.bg-white]="semanaHover() !== semana.semanaId && !isSemanaAtual(semana)"
            >
              <div>
                <!-- Topo do Card: Badge de Semana, Datas & Status -->
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span
                        class="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                        [class.bg-blue-600]="isSemanaAtual(semana)"
                        [class.text-white]="isSemanaAtual(semana)"
                        [class.bg-slate-100]="!isSemanaAtual(semana)"
                        [class.text-slate-700]="!isSemanaAtual(semana)"
                      >
                        Semana {{ i + 1 }}
                      </span>

                      @if (isSemanaAtual(semana)) {
                        <span class="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                          Em vigor
                        </span>
                      }
                    </div>

                    <!-- Intervalo de Datas da Semana -->
                    <p class="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                      <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{{ formatarPeriodoSemana(semana) }}</span>
                    </p>
                  </div>

                  <div class="flex items-center gap-1">
                    @if (isSemanaConcluida(semana)) {
                      <span class="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Concluída
                      </span>
                    } @else if (isSemanaAtual(semana)) {
                      <span class="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        Atual
                      </span>
                    } @else {
                      <span class="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                        Pendente
                      </span>
                    }

                    @if (semanasExibidas().length > 1) {
                      <button
                        type="button"
                        (click)="removerSemana(semana.semanaId)"
                        class="text-slate-300 hover:text-red-500 p-0.5 rounded transition-colors opacity-70 sm:opacity-0 sm:group-hover:opacity-100 ml-1"
                        title="Excluir esta semana da escala"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    }
                  </div>
                </div>

                <!-- Lista de Moradores Escalados nesta semana -->
                <div class="mb-3">
                  @if (semana.responsaveis && semana.responsaveis.length > 0) {
                    <!-- Cabeçalho de moradores com contagem -->
                    <div class="flex items-center justify-between mb-1.5">
                      <span class="text-[11px] font-semibold text-slate-600">
                        {{ semana.responsaveis.length === 1 ? '1 morador escalado' : semana.responsaveis.length + ' moradores (equipe)' }}
                      </span>
                      <button
                        type="button"
                        (click)="limparSemana(semana.semanaId)"
                        class="text-[10px] text-slate-400 hover:text-red-500 underline transition-colors"
                        title="Deixar semana vazia"
                      >
                        Esvaziar
                      </button>
                    </div>

                    <!-- Chips de Moradores Escalados (arrastáveis entre semanas) -->
                    <div class="space-y-1.5">
                      @for (m of semana.responsaveis; track m.id) {
                        <div
                          draggable="true"
                          (dragstart)="aoIniciarArrasto($event, m.id, semana.semanaId)"
                          (dragend)="aoFinalizarArrasto()"
                          class="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40 transition-all cursor-grab active:cursor-grabbing group/item"
                          [title]="'Arraste para mover ' + m.nome + ' para outra semana'"
                        >
                          <div class="flex items-center space-x-2 min-w-0">
                            <!-- Drag handle -->
                            <span class="text-slate-300 group-hover/item:text-blue-500">
                              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7 4a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0zM7 16a2 2 0 11-4 0 2 2 0 014 0zM17 4a2 2 0 11-4 0 2 2 0 014 0zM17 10a2 2 0 11-4 0 2 2 0 014 0zM17 16a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </span>
                            <img
                              [src]="m.avatarUrl || 'https://ui-avatars.com/api/?name=' + m.nome"
                              [alt]="m.nome"
                              class="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <span class="text-xs font-bold text-slate-800 truncate">{{ m.nome }}</span>
                          </div>

                          <!-- Botão Remover Morador da Semana -->
                          <button
                            type="button"
                            (click)="removerMorador(semana.semanaId, m.id)"
                            class="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-full transition-colors ml-1"
                            [title]="'Remover ' + m.nome + ' desta semana'"
                          >
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      }
                    </div>
                  } @else {
                    <!-- Semana Vazia (0 moradores) - Dropzone amigável -->
                    <div class="border-2 border-dashed border-slate-300 rounded-xl p-3.5 text-center bg-slate-50/60 my-2 transition-colors">
                      <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-1.5">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </div>
                      <p class="text-xs font-semibold text-slate-600">Sem morador escalado</p>
                      <p class="text-[10px] text-slate-400 mt-0.5">Arraste um morador para cá</p>
                    </div>
                  }

                  <!-- Botão Acessível: + Escalar Morador (Dropdown para Mobile e Cliques) -->
                  <div class="relative mt-2">
                    <button
                      type="button"
                      (click)="alternarMenuEscalar(semana.semanaId)"
                      class="w-full text-center py-1 px-2 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 text-slate-600 hover:text-blue-600 text-xs font-medium hover:bg-blue-50/50 transition-colors flex items-center justify-center gap-1"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Escalar Morador</span>
                    </button>

                    <!-- Dropdown Menu de Membros não escalados nesta semana -->
                    @if (menuEscalarAbertoPara() === semana.semanaId) {
                      <div
                        class="fixed inset-0 z-30"
                        (click)="fecharMenuEscalar()"
                      ></div>

                      <div class="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-40 max-h-48 overflow-y-auto">
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                          Escolha um morador:
                        </div>

                        @for (m of moradoresNaoEscalados(semana); track m.id) {
                          <button
                            type="button"
                            (click)="escalarMorador(semana.semanaId, m.id)"
                            class="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            <img
                              [src]="m.avatarUrl || 'https://ui-avatars.com/api/?name=' + m.nome"
                              [alt]="m.nome"
                              class="w-5 h-5 rounded-full object-cover"
                            />
                            <span class="truncate font-medium">{{ m.nome }}</span>
                          </button>
                        } @empty {
                          <div class="px-2 py-2 text-center text-[11px] text-slate-400">
                            Todos os moradores já estão nesta semana.
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Rodapé do Card -->
              <div class="pt-3 border-t border-slate-100 text-xs flex items-center justify-between">
                <span class="text-[11px] font-medium text-slate-400">
                  {{ isSemanaAtual(semana) ? 'Plantão em vigor' : 'Próximo revezamento' }}
                </span>

                @if (semanaHover() === semana.semanaId) {
                  <span class="text-[10px] font-bold text-blue-600 animate-pulse">
                    Solte aqui
                  </span>
                }
              </div>

            </div>
          }
        </div>
      } @else {
        <!-- Estado Vazio (Sem Moradores Cadastrados) -->
        <div class="py-12 text-center text-slate-400">
          <svg class="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-sm font-semibold text-slate-600">Nenhum ciclo de rodízio cadastrado.</p>
          <p class="text-xs text-slate-400 mt-0.5">Cadastre moradores para que o calendário do mês e a escala semanal sejam gerados.</p>
          <button
            type="button"
            (click)="service.abrirModalMembros()"
            class="mt-3 inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
          >
            + Adicionar Membros
          </button>
        </div>
      }

    </div>
  `
})
export class EscalaRodizioComponent {
  service = inject(CleanupService);

  // Alternância do mini calendário
  exibirCalendarioMensal = signal<boolean>(true);

  // Estados reativos para Drag and Drop
  arrastandoMorador = signal<{ moradorId: string; origemSemanaId: string | null } | null>(null);
  semanaHover = signal<string | null>(null);
  menuEscalarAbertoPara = signal<string | null>(null);

  /**
   * Semanas do rodízio ativo (cada semana direcionada a cada morador)
   */
  semanasExibidas = computed<EscalaSemana[]>(() => {
    return this.service.escala();
  });

  /**
   * Células do calendário mensal (grade 7 colunas por dias)
   */
  celulasCalendario = computed(() => {
    const { ano, mes } = this.service.mesVisualizacao();
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); // 0 = Dom, 1 = Seg, ...
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const diasMesAnterior = new Date(ano, mes, 0).getDate();

    const semanas = this.semanasExibidas();
    const agora = new Date();
    const hojeAno = agora.getFullYear();
    const hojeMes = agora.getMonth();
    const hojeDia = agora.getDate();

    const celulas: Array<{
      id: string;
      dia: number;
      doMesAtual: boolean;
      isHoje: boolean;
      semanaId: string | null;
      moradores: Morador[];
    }> = [];

    // Dias do mês anterior para completar o início da grade
    for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
      const dia = diasMesAnterior - i;
      celulas.push({
        id: `ant-${dia}`,
        dia,
        doMesAtual: false,
        isHoje: false,
        semanaId: null,
        moradores: []
      });
    }

    // Dias do mês atual
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataDia = new Date(ano, mes, dia, 12, 0, 0, 0);
      const isHoje = hojeAno === ano && hojeMes === mes && hojeDia === dia;

      // Localiza a semana exata que engloba esse dia
      const sem = semanas.find(s => {
        const ini = new Date(s.dataInicio);
        const fim = new Date(s.dataFim);
        return dataDia >= ini && dataDia <= fim;
      });

      let semanaIdDoDia: string | null = sem ? sem.semanaId : null;
      let moradoresDoDia: Morador[] = sem ? (sem.responsaveis || []) : [];

      // Se a data cair fora dos limites das semanas gravadas, mapeia de forma cíclica pelo rodízio
      if (!sem && semanas.length > 0) {
        const baseIni = new Date(semanas[0].dataInicio);
        const diffDias = Math.floor((dataDia.getTime() - baseIni.getTime()) / (1000 * 60 * 60 * 24));
        const diffSemanas = Math.floor(diffDias / 7);
        const cicloIndex = ((diffSemanas % semanas.length) + semanas.length) % semanas.length;
        const semCiclo = semanas[cicloIndex];
        if (semCiclo) {
          semanaIdDoDia = semCiclo.semanaId;
          moradoresDoDia = semCiclo.responsaveis || [];
        }
      }

      celulas.push({
        id: `atual-${dia}`,
        dia,
        doMesAtual: true,
        isHoje,
        semanaId: semanaIdDoDia,
        moradores: moradoresDoDia
      });
    }

    // Completa os dias restantes até preencher a última linha
    const restante = 7 - (celulas.length % 7);
    if (restante < 7) {
      for (let i = 1; i <= restante; i++) {
        celulas.push({
          id: `prox-${i}`,
          dia: i,
          doMesAtual: false,
          isHoje: false,
          semanaId: null,
          moradores: []
        });
      }
    }

    return celulas;
  });

  // MÉTODOS DE NAVEGAÇÃO DE MÊS

  voltarMes(): void {
    this.service.voltarMes();
  }

  avancarMes(): void {
    this.service.avancarMes();
  }

  irParaMesAtual(): void {
    this.service.irParaMesAtual();
  }

  isMesAtual(): boolean {
    const agora = new Date();
    const { ano, mes } = this.service.mesVisualizacao();
    return agora.getFullYear() === ano && agora.getMonth() === mes;
  }

  alternarVisualizacaoCalendario(): void {
    this.exibirCalendarioMensal.update(v => !v);
  }

  equilibrarMes(): void {
    const { ano, mes } = this.service.mesVisualizacao();
    this.service.equilibrarMes(ano, mes);
  }

  adicionarSemanaNoMes(): void {
    const { ano, mes } = this.service.mesVisualizacao();
    this.service.adicionarSemanaNoMes(ano, mes);
  }

  selecionarSemana(semanaId: string | null): void {
    if (!semanaId) return;
    this.semanaHover.set(semanaId);
    const el = document.getElementById(`card-semana-${semanaId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    setTimeout(() => {
      if (this.semanaHover() === semanaId) {
        this.semanaHover.set(null);
      }
    }, 1500);
  }

  // MÉTODOS DE DRAG AND DROP

  aoIniciarArrasto(event: DragEvent, moradorId: string, origemSemanaId: string | null = null): void {
    this.arrastandoMorador.set({ moradorId, origemSemanaId });
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify({ moradorId, origemSemanaId }));
    }
  }

  aoFinalizarArrasto(): void {
    this.arrastandoMorador.set(null);
    this.semanaHover.set(null);
  }

  aoArrastarSobre(event: DragEvent, semanaId: string): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (this.semanaHover() !== semanaId) {
      this.semanaHover.set(semanaId);
    }
  }

  aoEntrarNaZona(event: DragEvent, semanaId: string): void {
    event.preventDefault();
    this.semanaHover.set(semanaId);
  }

  aoSairDaZona(event: DragEvent, semanaId: string): void {
    if (this.semanaHover() === semanaId) {
      this.semanaHover.set(null);
    }
  }

  aoSoltar(event: DragEvent, destinoSemanaId: string): void {
    event.preventDefault();
    let moradorId: string | null = null;
    let origemSemanaId: string | null = null;

    const estadoAtual = this.arrastandoMorador();
    if (estadoAtual) {
      moradorId = estadoAtual.moradorId;
      origemSemanaId = estadoAtual.origemSemanaId;
    } else if (event.dataTransfer) {
      try {
        const dados = JSON.parse(event.dataTransfer.getData('text/plain'));
        moradorId = dados.moradorId;
        origemSemanaId = dados.origemSemanaId;
      } catch {}
    }

    if (moradorId) {
      this.service.moverMoradorEntreSemanas(moradorId, origemSemanaId, destinoSemanaId);
    }

    this.arrastandoMorador.set(null);
    this.semanaHover.set(null);
  }

  alternarMenuEscalar(semanaId: string): void {
    this.menuEscalarAbertoPara.update(atual => (atual === semanaId ? null : semanaId));
  }

  fecharMenuEscalar(): void {
    this.menuEscalarAbertoPara.set(null);
  }

  escalarMorador(semanaId: string, moradorId: string): void {
    this.service.adicionarMoradorNaSemana(semanaId, moradorId);
    this.fecharMenuEscalar();
  }

  removerMorador(semanaId: string, moradorId: string): void {
    this.service.removerMoradorDaSemana(semanaId, moradorId);
  }

  limparSemana(semanaId: string): void {
    this.service.limparMoradoresDaSemana(semanaId);
  }

  removerSemana(semanaId: string): void {
    this.service.removerSemana(semanaId);
  }

  // RETROCOMPATIBILIDADE COM AÇÕES ANTERIORES
  redefinirEscala(): void {
    this.equilibrarMes();
  }

  adicionarSemanaNaEscala(): void {
    this.adicionarSemanaNoMes();
  }

  moradoresNaoEscalados(semana: EscalaSemana): Morador[] {
    const escaladosIds = new Set((semana.responsaveis || []).map(m => m.id));
    return this.service.moradores().filter(m => !escaladosIds.has(m.id));
  }

  contarSemanasDoMoradorNoMes(moradorId: string): string {
    const semanas = this.semanasExibidas();
    const qtd = semanas.filter(s => (s.responsaveis || []).some(m => m.id === moradorId)).length;
    if (qtd === 0) return '0 sem';
    if (qtd === 1) return '1 sem';
    return `${qtd} sem`;
  }

  isSemanaAtual(semana: EscalaSemana): boolean {
    if (semana.status === 'EM_ANDAMENTO') return true;
    const agora = new Date();
    const ini = new Date(semana.dataInicio);
    const fim = new Date(semana.dataFim);
    return agora >= ini && agora <= fim;
  }

  isSemanaConcluida(semana: EscalaSemana): boolean {
    if (semana.status === 'CONCLUIDO') return true;
    const agora = new Date();
    const fim = new Date(semana.dataFim);
    return agora > fim;
  }

  nomeDoMes(mes: number): string {
    const nomes = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return nomes[mes] || '';
  }

  formatarPeriodoSemana(semana: EscalaSemana): string {
    const ini = new Date(semana.dataInicio);
    const fim = new Date(semana.dataFim);
    const diaIni = ini.getDate().toString().padStart(2, '0');
    const diaFim = fim.getDate().toString().padStart(2, '0');
    const mesesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mesFim = mesesAbrev[fim.getMonth()];
    return `${diaIni} a ${diaFim} de ${mesFim}`;
  }

  formatarNomes(moradores: Morador[]): string {
    if (!moradores || moradores.length === 0) return '';
    return moradores.map(m => m.nome).join(', ');
  }
}
