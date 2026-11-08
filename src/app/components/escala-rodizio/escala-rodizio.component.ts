import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CleanupService } from '../../services/cleanup.service';
import { EscalaSemana, Morador } from '../../models/cleanup.model';

export interface CelulaCalendarioDia {
  id: string;
  dataIso: string;
  dia: number;
  mes: number;
  ano: number;
  doMesAtual: boolean;
  isHoje: boolean;
  isFimDeSemana: boolean;
  semanaId: string | null;
  semanaNumero: number;
  moradores: Morador[];
}

export interface SemanaDoCalendario {
  semanaId: string;
  numero: number;
  label: string;
  dataInicioFormatada: string;
  dataFimFormatada: string;
  status: 'EM_ANDAMENTO' | 'PENDENTE' | 'CONCLUIDO';
  isSemanaAtual: boolean;
  dias: CelulaCalendarioDia[];
}

@Component({
  selector: 'app-escala-rodizio',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 transition-all duration-200">
      
      <!-- Cabeçalho Principal da Escala -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div class="flex items-center space-x-2">
            <h3 class="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center">
              <span class="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></span>
              Visão da Escala de Rodízio
            </h3>
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Calendário Mensal
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            Mova qualquer morador diretamente para um dia específico arrastando ou clicando em (+). Na virada do mês, o calendário avança automaticamente.
          </p>
        </div>

        @if (service.moradores().length > 0) {
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center text-xs font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70">
              <span class="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
              {{ service.moradores().length }} moradores
            </span>
          </div>
        }
      </div>

      @if (service.moradores().length > 0) {
        
        <!-- Barra de Ferramentas / Navegação do Mês -->
        <div class="mt-4 p-2.5 sm:p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-wrap items-center justify-between gap-2.5">
          
          <!-- Navegador de Mês / Ano -->
          <div class="flex items-center gap-2">
            <div class="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                (click)="voltarMes()"
                class="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Mês anterior"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div class="px-3 py-1 flex items-center gap-2 min-w-[150px] justify-center select-none">
                <span class="text-xs sm:text-sm font-bold text-slate-800 capitalize">
                  {{ nomeDoMes(service.mesVisualizacao().mes) }} {{ service.mesVisualizacao().ano }}
                </span>
                @if (isMesAtual()) {
                  <span class="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full uppercase">
                    Atual
                  </span>
                }
              </div>

              <button
                type="button"
                (click)="avancarMes()"
                class="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Próximo mês"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            @if (!isMesAtual()) {
              <button
                type="button"
                (click)="irParaMesAtual()"
                class="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 shadow-2xs transition-colors"
              >
                Mês Atual
              </button>
            }
          </div>

          <!-- Ações do Mês -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="solicitarEquilibrarMes()"
              class="inline-flex items-center text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition-all active:scale-95"
              title="Equilibrar revezamento dos moradores neste mês"
            >
              <svg class="w-4 h-4 mr-1 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Equilibrar
            </button>

            <button
              type="button"
              (click)="solicitarLimparMes()"
              class="inline-flex items-center text-xs sm:text-sm font-semibold text-slate-500 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition-all active:scale-95"
              title="Limpar todos os plantões deste mês"
            >
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpar
            </button>
          </div>

        </div>

        <!-- Bancada Minimalista de Moradores (Arrastáveis para qualquer dia) -->
        <div class="mt-3 p-2.5 sm:p-3 rounded-xl bg-slate-50/60 border border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
              <svg class="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
              </svg>
              Arraste para o dia:
            </span>

            @for (m of service.moradores(); track m.id) {
              <div
                draggable="true"
                (dragstart)="aoIniciarArrastoDia($event, m.id, null)"
                (dragend)="aoFinalizarArrasto()"
                class="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing select-none"
                [title]="'Arraste ' + m.nome + ' para qualquer dia de ' + nomeDoMes(service.mesVisualizacao().mes)"
              >
                <img
                  [src]="m.avatarUrl || 'https://ui-avatars.com/api/?name=' + m.nome"
                  [alt]="m.nome"
                  class="w-5 h-5 rounded-full object-cover border border-slate-200"
                />
                <span class="text-xs font-medium text-slate-800">{{ m.nome }}</span>
                <span
                  class="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-500"
                  title="Dias escalado(a) neste mês"
                >
                  {{ contarDiasDoMoradorNoMes(m.id) }}
                </span>
              </div>
            }
          </div>

          <button
            type="button"
            (click)="service.abrirModalMembros()"
            class="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 rounded-md hover:bg-blue-50 transition-colors shrink-0"
          >
            + Novo Membro
          </button>
        </div>

        <!-- CALENDÁRIO MENSAL (GRADE UNIFICADA E ORGANIZADA) -->
        <div class="mt-5">
          
          <!-- Cabeçalho dos 7 Dias da Semana -->
          <div class="grid grid-cols-7 gap-1.5 sm:gap-2 text-center pb-2 border-b border-slate-100">
            @for (diaNome of ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']; track diaNome; let idx = $index) {
              <span
                class="text-[11px] font-bold uppercase tracking-wider"
                [class.text-rose-500]="idx === 0 || idx === 6"
                [class.text-slate-400]="idx !== 0 && idx !== 6"
              >
                {{ diaNome }}
              </span>
            }
          </div>

          <!-- Linhas de Semanas com Dias Alinhados -->
          <div class="space-y-3 mt-3">
            @for (semana of semanasDoMesCalendario(); track semana.semanaId; let sIdx = $index) {
              <div
                [id]="'card-semana-' + semana.semanaId"
                (dragover)="aoArrastarSobre($event, semana.semanaId)"
                (drop)="aoSoltar($event, semana.semanaId)"
              >
                <!-- Linha Discreta com Identificação da Semana -->
                <div class="flex items-center justify-between text-xs px-1 mb-1.5">
                  <div class="flex items-center gap-1.5">
                    <span
                      class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                      [class.bg-blue-600]="semana.isSemanaAtual"
                      [class.text-white]="semana.isSemanaAtual"
                      [class.bg-slate-100]="!semana.isSemanaAtual"
                      [class.text-slate-600]="!semana.isSemanaAtual"
                    >
                      Semana {{ semana.numero }}
                    </span>
                    <span class="text-[11px] text-slate-400 font-medium hidden sm:inline">
                      {{ semana.dataInicioFormatada }} – {{ semana.dataFimFormatada }}
                    </span>
                  </div>

                  <div class="flex items-center gap-2">
                    @if (semana.status === 'CONCLUIDO') {
                      <span class="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Concluída
                      </span>
                    } @else if (semana.isSemanaAtual) {
                      <span class="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        Atual
                      </span>
                    }

                    <!-- Ação Rápida: Escalar Semana Inteira via Dropdown -->
                    <div class="relative">
                      <button
                        type="button"
                        (click)="alternarMenuEscalar(semana.semanaId)"
                        class="text-[10px] font-medium text-slate-400 hover:text-blue-600 transition-colors"
                        title="Escalar morador para todos os dias desta semana"
                      >
                        + Escalar Semana
                      </button>

                      @if (menuEscalarAbertoPara() === semana.semanaId) {
                        <div class="fixed inset-0 z-30" (click)="fecharMenuEscalar()"></div>
                        <div class="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-40 min-w-[160px] max-h-48 overflow-y-auto">
                          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                            Escalar na semana {{ semana.numero }}:
                          </div>
                          @for (m of service.moradores(); track m.id) {
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
                          }
                        </div>
                      }
                    </div>

                    <!-- Esvaziar Semana -->
                    <button
                      type="button"
                      (click)="solicitarLimparSemana(semana.semanaId, semana.label)"
                      class="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors px-1 py-0.5 rounded hover:bg-red-50"
                      title="Limpar moradores desta semana"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <!-- Os 7 Dias da Linha da Semana -->
                <div class="grid grid-cols-7 gap-1.5 sm:gap-2">
                  @for (celula of semana.dias; track celula.id) {
                    <div
                      (dragover)="aoArrastarSobreDia($event, celula.dataIso)"
                      (dragenter)="aoEntrarNoDia($event, celula.dataIso)"
                      (dragleave)="aoSairDoDia($event, celula.dataIso)"
                      (drop)="aoSoltarNoDia($event, celula.dataIso)"
                      class="min-h-[95px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-xl border transition-all duration-150 flex flex-col justify-between group/dia relative select-none"
                      [class.bg-blue-50/40]="celula.isHoje && diaHover() !== celula.dataIso"
                      [class.border-blue-400]="celula.isHoje && diaHover() !== celula.dataIso"
                      [class.ring-2]="celula.isHoje && diaHover() !== celula.dataIso"
                      [class.ring-blue-200/80]="celula.isHoje && diaHover() !== celula.dataIso"
                      [class.shadow-2xs]="celula.isHoje"
                      [class.bg-indigo-50]="diaHover() === celula.dataIso"
                      [class.border-indigo-500]="diaHover() === celula.dataIso"
                      [class.ring-2]="diaHover() === celula.dataIso"
                      [class.ring-indigo-300]="diaHover() === celula.dataIso"
                      [class.scale-[1.01]]="diaHover() === celula.dataIso"
                      [class.bg-white]="!celula.isHoje && celula.doMesAtual && diaHover() !== celula.dataIso"
                      [class.border-slate-200/80]="!celula.isHoje && celula.doMesAtual && diaHover() !== celula.dataIso"
                      [class.hover:border-slate-300]="celula.doMesAtual"
                      [class.hover:shadow-2xs]="celula.doMesAtual"
                      [class.bg-slate-50/40]="!celula.doMesAtual"
                      [class.border-slate-100]="!celula.doMesAtual"
                      [class.opacity-30]="!celula.doMesAtual"
                    >
                      <!-- Topo da Célula: Dia e Botão Discreto de Adição (+) -->
                      <div class="flex items-center justify-between">
                        <div>
                          @if (celula.isHoje) {
                            <span class="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                              {{ celula.dia }}
                            </span>
                          } @else {
                            <span
                              class="text-xs font-semibold leading-none ml-0.5"
                              [class.text-slate-800]="celula.doMesAtual"
                              [class.text-slate-400]="!celula.doMesAtual"
                            >
                              {{ celula.dia }}
                            </span>
                          }
                        </div>

                        <!-- Botão + para Escalar Morador neste dia específico -->
                        @if (celula.doMesAtual) {
                          <div class="relative">
                            <button
                              type="button"
                              (click)="alternarMenuDia(celula.dataIso); $event.stopPropagation()"
                              class="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors opacity-70 sm:opacity-0 sm:group-hover/dia:opacity-100"
                              [title]="'Adicionar morador ao dia ' + celula.dia"
                            >
                              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                              </svg>
                            </button>

                            <!-- Dropdown de Atribuição no Dia -->
                            @if (menuDiaAbertoPara() === celula.dataIso) {
                              <div class="fixed inset-0 z-40" (click)="fecharMenuDia()"></div>
                              <div class="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 min-w-[170px] max-h-48 overflow-y-auto">
                                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                                  Escalar dia {{ celula.dia }}:
                                </div>
                                @for (m of moradoresNaoEscaladosNoDia(celula.dataIso); track m.id) {
                                  <button
                                    type="button"
                                    (click)="escalarMoradorNoDia(celula.dataIso, m.id); $event.stopPropagation()"
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
                                  <div class="px-2 py-1.5 text-center text-[10px] text-slate-400">
                                    Todos já escalados neste dia.
                                  </div>
                                }
                              </div>
                            }
                          </div>
                        }
                      </div>

                      <!-- Meio da Célula: Chips de Moradores Escalados -->
                      <div class="my-1 space-y-1">
                        @for (m of celula.moradores; track m.id) {
                          <div
                            draggable="true"
                            (dragstart)="aoIniciarArrastoDia($event, m.id, celula.dataIso)"
                            (dragend)="aoFinalizarArrasto()"
                            class="flex items-center justify-between gap-1 p-1 rounded-lg bg-slate-50 hover:bg-blue-50/80 border border-slate-200/70 transition-all cursor-grab active:cursor-grabbing group/chip"
                            [title]="'Arraste ' + m.nome + ' para outro dia do mês'"
                          >
                            <div class="flex items-center gap-1 min-w-0">
                              <img
                                [src]="m.avatarUrl || 'https://ui-avatars.com/api/?name=' + m.nome"
                                [alt]="m.nome"
                                class="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                              <span class="text-[11px] font-semibold text-slate-800 truncate">
                                {{ m.nome.split(' ')[0] }}
                              </span>
                            </div>

                            <!-- Botão Remover do Dia (Aparece no hover do chip) -->
                            <button
                              type="button"
                              (click)="solicitarRemoverMoradorDoDia(celula.dataIso, m); $event.stopPropagation()"
                              class="text-slate-300 hover:text-red-500 p-0.5 rounded transition-opacity opacity-70 sm:opacity-0 sm:group-hover/chip:opacity-100 shrink-0"
                              [title]="'Remover ' + m.nome + ' deste dia'"
                            >
                              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        }
                      </div>

                      <!-- Rodapé da Célula: Indicador de Soltura -->
                      <div>
                        @if (diaHover() === celula.dataIso) {
                          <div class="text-[9px] font-bold text-indigo-600 text-center animate-pulse">
                            Soltar aqui
                          </div>
                        }
                      </div>

                    </div>
                  }
                </div>

              </div>
            }
          </div>

        </div>

      } @else {
        <!-- Estado Vazio (Sem Moradores Cadastrados) -->
        <div class="py-12 text-center text-slate-400">
          <svg class="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-sm font-semibold text-slate-600">Nenhum ciclo de rodízio cadastrado.</p>
          <p class="text-xs text-slate-400 mt-0.5">Cadastre moradores para que o calendário do mês e a escala sejam gerados.</p>
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

  // Visibilidade do calendário
  exibirCalendarioMensal = signal<boolean>(true);

  // Estados reativos para Drag and Drop
  arrastandoMorador = signal<{
    moradorId: string;
    origemSemanaId: string | null;
    origemDataIso?: string | null;
  } | null>(null);

  semanaHover = signal<string | null>(null);
  diaHover = signal<string | null>(null);

  menuEscalarAbertoPara = signal<string | null>(null);
  menuDiaAbertoPara = signal<string | null>(null);

  /**
   * Semanas do rodízio ativo
   */
  semanasExibidas = computed<EscalaSemana[]>(() => {
    return this.service.escala();
  });

  /**
   * Células do calendário mensal (grade plana 7 colunas por dias)
   */
  celulasCalendario = computed(() => {
    const { ano, mes } = this.service.mesVisualizacao();
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); // 0 = Dom, 1 = Seg, ...
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const diasMesAnterior = new Date(ano, mes, 0).getDate();

    const agora = this.service.dataHoje();
    const hojeAno = agora.getFullYear();
    const hojeMes = agora.getMonth();
    const hojeDia = agora.getDate();

    const celulas: CelulaCalendarioDia[] = [];

    // Dias do mês anterior para completar o início da grade
    for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
      const dia = diasMesAnterior - i;
      const mesAnt = mes === 0 ? 11 : mes - 1;
      const anoAnt = mes === 0 ? ano - 1 : ano;
      const dataIso = `${anoAnt}-${(mesAnt + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
      const moradores = this.service.obterMoradoresDoDia(dataIso);

      celulas.push({
        id: `ant-${dia}`,
        dataIso,
        dia,
        mes: mesAnt,
        ano: anoAnt,
        doMesAtual: false,
        isHoje: false,
        isFimDeSemana: new Date(anoAnt, mesAnt, dia).getDay() === 0 || new Date(anoAnt, mesAnt, dia).getDay() === 6,
        semanaId: null,
        semanaNumero: 1,
        moradores
      });
    }

    // Dias do mês atual
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataIso = `${ano}-${(mes + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
      const isHoje = hojeAno === ano && hojeMes === mes && hojeDia === dia;
      const diaSemana = new Date(ano, mes, dia).getDay();
      const isFimDeSemana = diaSemana === 0 || diaSemana === 6;

      const celulaIndex = celulas.length;
      const semanaNumero = Math.floor(celulaIndex / 7) + 1;
      const semanaDaEscala = this.semanasExibidas()[semanaNumero - 1];
      const semanaId = semanaDaEscala ? semanaDaEscala.semanaId : `sem-${semanaNumero}`;

      const moradores = this.service.obterMoradoresDoDia(dataIso);

      celulas.push({
        id: `atual-${dia}`,
        dataIso,
        dia,
        mes,
        ano,
        doMesAtual: true,
        isHoje,
        isFimDeSemana,
        semanaId,
        semanaNumero,
        moradores
      });
    }

    // Completa os dias restantes até preencher a última linha
    const restante = 7 - (celulas.length % 7);
    if (restante < 7) {
      const mesProx = mes === 11 ? 0 : mes + 1;
      const anoProx = mes === 11 ? ano + 1 : ano;
      for (let i = 1; i <= restante; i++) {
        const dataIso = `${anoProx}-${(mesProx + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
        const moradores = this.service.obterMoradoresDoDia(dataIso);

        celulas.push({
          id: `prox-${i}`,
          dataIso,
          dia: i,
          mes: mesProx,
          ano: anoProx,
          doMesAtual: false,
          isHoje: false,
          isFimDeSemana: new Date(anoProx, mesProx, i).getDay() === 0 || new Date(anoProx, mesProx, i).getDay() === 6,
          semanaId: null,
          semanaNumero: Math.floor(celulas.length / 7) + 1,
          moradores
        });
      }
    }

    return celulas;
  });

  /**
   * Semanas do mês agrupadas em blocos de 7 dias para visualização estruturada no calendário
   */
  semanasDoMesCalendario = computed<SemanaDoCalendario[]>(() => {
    const celulas = this.celulasCalendario();
    const grupos: SemanaDoCalendario[] = [];
    const totalLinhas = Math.ceil(celulas.length / 7);
    const escala = this.service.escala();

    for (let r = 0; r < totalLinhas; r++) {
      const diasDaSemana = celulas.slice(r * 7, (r + 1) * 7);
      const primeiroDia = diasDaSemana[0];
      const ultimoDia = diasDaSemana[diasDaSemana.length - 1];

      const semanaNumero = r + 1;
      const semEscala = escala[r];
      const semanaId = semEscala ? semEscala.semanaId : (primeiroDia.semanaId || `sem-${semanaNumero}`);

      const contemHoje = diasDaSemana.some(d => d.isHoje);
      const ehPassada = diasDaSemana.every(d => {
        const agora = this.service.dataHoje();
        const dDate = new Date(d.ano, d.mes, d.dia, 23, 59, 59);
        return dDate < agora;
      });

      let status: 'EM_ANDAMENTO' | 'PENDENTE' | 'CONCLUIDO' = 'PENDENTE';
      if (contemHoje || (semEscala && semEscala.status === 'EM_ANDAMENTO')) {
        status = 'EM_ANDAMENTO';
      } else if (ehPassada || (semEscala && semEscala.status === 'CONCLUIDO')) {
        status = 'CONCLUIDO';
      }

      const mesesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const dataInicioFormatada = `${primeiroDia.dia.toString().padStart(2, '0')} de ${mesesAbrev[primeiroDia.mes]}`;
      const dataFimFormatada = `${ultimoDia.dia.toString().padStart(2, '0')} de ${mesesAbrev[ultimoDia.mes]}`;

      grupos.push({
        numero: semanaNumero,
        semanaId,
        label: `Semana ${semanaNumero}`,
        dataInicioFormatada,
        dataFimFormatada,
        status,
        isSemanaAtual: status === 'EM_ANDAMENTO',
        dias: diasDaSemana
      });
    }

    return grupos;
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
    const agora = this.service.dataHoje();
    const { ano, mes } = this.service.mesVisualizacao();
    return agora.getFullYear() === ano && agora.getMonth() === mes;
  }

  alternarVisualizacaoCalendario(): void {
    this.exibirCalendarioMensal.update(v => !v);
  }

  solicitarEquilibrarMes(): void {
    const { ano, mes } = this.service.mesVisualizacao();
    const nomeMes = this.nomeDoMes(mes);
    this.service.solicitarConfirmacao({
      titulo: 'Equilibrar Rodízio',
      mensagem: `Tem certeza que deseja redistribuir e equilibrar as escalas de ${nomeMes} de ${ano} igualmente entre os moradores?`,
      tipo: 'aviso',
      textoBotaoConfirmar: 'Sim, equilibrar',
      acaoConfirmar: () => this.equilibrarMes()
    });
  }

  equilibrarMes(): void {
    const { ano, mes } = this.service.mesVisualizacao();
    this.service.equilibrarMes(ano, mes);
  }

  solicitarLimparMes(): void {
    const { ano, mes } = this.service.mesVisualizacao();
    const nomeMes = this.nomeDoMes(mes);
    this.service.solicitarConfirmacao({
      titulo: 'Limpar Escala do Mês',
      mensagem: `Tem certeza que deseja excluir todos os plantões de ${nomeMes} de ${ano}?`,
      tipo: 'excluir',
      textoBotaoConfirmar: 'Sim, limpar escala',
      acaoConfirmar: () => this.limparMes()
    });
  }

  limparMes(): void {
    const { ano, mes } = this.service.mesVisualizacao();
    this.service.limparMes(ano, mes);
  }

  solicitarLimparSemana(semanaId: string, rotulo?: string): void {
    this.service.solicitarConfirmacao({
      titulo: 'Limpar Semana',
      mensagem: `Tem certeza que deseja remover os responsáveis de ${rotulo || 'esta semana'}?`,
      tipo: 'excluir',
      textoBotaoConfirmar: 'Sim, limpar semana',
      acaoConfirmar: () => this.limparSemana(semanaId)
    });
  }

  solicitarRemoverMoradorDoDia(dataIso: string, morador: Morador): void {
    this.service.solicitarConfirmacao({
      titulo: 'Remover da Escala',
      mensagem: `Tem certeza que deseja excluir ${morador.nome} da escala deste dia?`,
      tipo: 'excluir',
      textoBotaoConfirmar: 'Sim, remover',
      acaoConfirmar: () => this.removerMoradorDoDia(dataIso, morador.id)
    });
  }

  adicionarSemanaNoMes(): void {
    const { ano, mes } = this.service.mesVisualizacao();
    this.service.adicionarSemanaNoMes(ano, mes);
  }

  // MÉTODOS DE DRAG AND DROP POR DIA E POR SEMANA

  aoIniciarArrastoDia(event: DragEvent, moradorId: string, origemDataIso: string | null = null): void {
    this.arrastandoMorador.set({
      moradorId,
      origemSemanaId: null,
      origemDataIso
    });
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify({ moradorId, origemDataIso }));
    }
  }

  aoArrastarSobreDia(event: DragEvent, dataIso: string): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (this.diaHover() !== dataIso) {
      this.diaHover.set(dataIso);
    }
  }

  aoEntrarNoDia(event: DragEvent, dataIso: string): void {
    event.preventDefault();
    this.diaHover.set(dataIso);
  }

  aoSairDoDia(event: DragEvent, dataIso: string): void {
    if (this.diaHover() === dataIso) {
      this.diaHover.set(null);
    }
  }

  aoSoltarNoDia(event: DragEvent, destinoDataIso: string): void {
    event.preventDefault();
    let moradorId: string | null = null;
    let origemDataIso: string | null = null;

    const estado = this.arrastandoMorador();
    if (estado) {
      moradorId = estado.moradorId;
      origemDataIso = estado.origemDataIso || null;
    } else if (event.dataTransfer) {
      try {
        const dados = JSON.parse(event.dataTransfer.getData('text/plain'));
        moradorId = dados.moradorId;
        origemDataIso = dados.origemDataIso || null;
      } catch {}
    }

    if (moradorId) {
      this.service.moverMoradorEntreDias(moradorId, origemDataIso, destinoDataIso);
    }

    this.arrastandoMorador.set(null);
    this.diaHover.set(null);
    this.semanaHover.set(null);
  }

  // MÉTODOS DE DRAG AND DROP POR SEMANA (RETROCOMPATIBILIDADE)

  aoIniciarArrasto(event: DragEvent, moradorId: string, origemSemanaId: string | null = null): void {
    this.arrastandoMorador.set({ moradorId, origemSemanaId, origemDataIso: null });
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify({ moradorId, origemSemanaId }));
    }
  }

  aoFinalizarArrasto(): void {
    this.arrastandoMorador.set(null);
    this.semanaHover.set(null);
    this.diaHover.set(null);
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
    this.diaHover.set(null);
  }

  // CONTROLE DE MENUS DE ATRIBUIÇÃO

  alternarMenuDia(dataIso: string): void {
    this.menuDiaAbertoPara.update(atual => (atual === dataIso ? null : dataIso));
  }

  fecharMenuDia(): void {
    this.menuDiaAbertoPara.set(null);
  }

  escalarMoradorNoDia(dataIso: string, moradorId: string): void {
    this.service.atribuirMoradorAoDia(dataIso, moradorId);
    this.fecharMenuDia();
  }

  removerMoradorDoDia(dataIso: string, moradorId: string): void {
    this.service.removerMoradorDoDia(dataIso, moradorId);
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

  // MÉTODOS DE FILTRO E CONTAGEM

  moradoresNaoEscaladosNoDia(dataIso: string): Morador[] {
    const escalados = this.service.obterMoradoresDoDia(dataIso);
    const escaladosIds = new Set(escalados.map(m => m.id));
    return this.service.moradores().filter(m => !escaladosIds.has(m.id));
  }

  moradoresNaoEscalados(semana: EscalaSemana): Morador[] {
    const escaladosIds = new Set((semana.responsaveis || []).map(m => m.id));
    return this.service.moradores().filter(m => !escaladosIds.has(m.id));
  }

  contarDiasDoMoradorNoMes(moradorId: string): string {
    const celulas = this.celulasCalendario().filter(c => c.doMesAtual);
    const qtd = celulas.filter(c => c.moradores.some(m => m.id === moradorId)).length;
    if (qtd === 0) return '0 dias';
    if (qtd === 1) return '1 dia';
    return `${qtd} dias`;
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
    const agora = this.service.dataHoje();
    const ini = new Date(semana.dataInicio);
    const fim = new Date(semana.dataFim);
    return agora >= ini && agora <= fim;
  }

  isSemanaConcluida(semana: EscalaSemana): boolean {
    if (semana.status === 'CONCLUIDO') return true;
    const agora = this.service.dataHoje();
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
