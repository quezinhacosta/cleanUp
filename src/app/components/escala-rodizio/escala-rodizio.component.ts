import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CleanupService } from '../../services/cleanup.service';
import { EscalaSemana, Morador } from '../../models/cleanup.model';

@Component({
  selector: 'app-escala-rodizio',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 transition-all duration-200 hover:shadow-md">
      
      <!-- Cabeçalho da Escala e Controles -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div class="flex items-center space-x-2">
            <h3 class="text-lg font-bold text-slate-900 tracking-tight flex items-center">
              <span class="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></span>
              Visão da Escala de Rodízio
            </h3>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Personalizável
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            Arraste moradores entre as semanas. É permitido ter múltiplos moradores em uma semana ou deixá-la sem morador.
          </p>
        </div>

        <!-- Botões de Ação da Escala -->
        <div class="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            (click)="service.redefinirEscala()"
            class="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
            title="Redistribuir moradores automaticamente em ciclo equilibrado"
          >
            <svg class="w-3.5 h-3.5 mr-1.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Equilibrar Rodízio
          </button>

          <button
            type="button"
            (click)="service.adicionarSemanaNaEscala()"
            class="inline-flex items-center text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
            title="Adicionar mais uma semana à escala"
          >
            <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            + Nova Semana
          </button>
        </div>
      </div>

      <!-- Faixa / Bancada de Moradores Disponíveis para Arrastar -->
      @if (service.moradores().length > 0) {
        <div class="mt-4 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <span class="text-xs font-semibold text-slate-700 flex items-center">
              <svg class="w-4 h-4 mr-1.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
              </svg>
              Moradores (arraste para qualquer semana ou clique para gerenciar):
            </span>
            <span class="text-[11px] text-slate-500">
              Dica: Você também pode arrastar moradores diretamente de uma semana para outra
            </span>
          </div>

          <div class="flex flex-wrap gap-2 items-center">
            @for (m of service.moradores(); track m.id) {
              <div
                draggable="true"
                (dragstart)="aoIniciarArrasto($event, m.id, null)"
                (dragend)="aoFinalizarArrasto()"
                class="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-sm transition-all select-none group"
                [title]="'Arraste ' + m.nome + ' para uma semana'"
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
      }

      <!-- Grid de Semanas da Escala (Drop Zones) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        @for (semana of service.escala(); track semana.semanaId; let i = $index) {
          <div
            (dragover)="aoArrastarSobre($event, semana.semanaId)"
            (dragenter)="aoEntrarNaZona($event, semana.semanaId)"
            (dragleave)="aoSairDaZona($event, semana.semanaId)"
            (drop)="aoSoltar($event, semana.semanaId)"
            class="rounded-xl border p-4 transition-all duration-150 flex flex-col justify-between relative group"
            [class.border-blue-500]="semanaHover() === semana.semanaId"
            [class.bg-blue-50/60]="semanaHover() === semana.semanaId"
            [class.ring-2]="semanaHover() === semana.semanaId"
            [class.ring-blue-300]="semanaHover() === semana.semanaId"
            [class.border-blue-300]="semanaHover() !== semana.semanaId && i === 0"
            [class.bg-blue-50/20]="semanaHover() !== semana.semanaId && i === 0"
            [class.shadow-xs]="i === 0"
            [class.border-slate-200]="semanaHover() !== semana.semanaId && i > 0"
            [class.bg-white]="semanaHover() !== semana.semanaId && i > 0"
          >
            <div>
              <!-- Topo do Card: Badge de Semana, Status & Botão de Excluir Semana -->
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-1.5">
                  <span
                    class="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                    [class.bg-blue-600]="i === 0"
                    [class.text-white]="i === 0"
                    [class.bg-slate-100]="i > 0"
                    [class.text-slate-600]="i > 0"
                  >
                    {{ i === 0 ? 'Semana Atual' : 'Semana ' + (i + 1) }}
                  </span>

                  @if (i > 0) {
                    <button
                      type="button"
                      (click)="removerSemana(semana.semanaId)"
                      class="text-slate-300 hover:text-red-500 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Excluir esta semana da escala"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  }
                </div>

                @switch (semana.status) {
                  @case ('CONCLUIDO') {
                    <span class="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Concluído
                    </span>
                  }
                  @case ('EM_ANDAMENTO') {
                    <span class="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      Em Curso
                    </span>
                  }
                  @default {
                    <span class="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                      Pendente
                    </span>
                  }
                }
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
                    <!-- Backdrop para fechar -->
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

            <!-- Rodapé do Card: Datas -->
            <div class="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span class="flex items-center text-[11px]">
                <svg class="w-3.5 h-3.5 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ formatarDataCurta(semana.dataInicio) }} - {{ formatarDataCurta(semana.dataFim) }}
              </span>

              @if (semanaHover() === semana.semanaId) {
                <span class="text-[10px] font-bold text-blue-600 animate-pulse">
                  Solte aqui
                </span>
              }
            </div>

          </div>
        } @empty {
          <div class="col-span-full py-8 text-center text-slate-400">
            <svg class="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-xs">Nenhum ciclo de rodízio cadastrado.</p>
            <button
              type="button"
              (click)="service.abrirModalMembros()"
              class="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              + Adicionar Membros
            </button>
          </div>
        }
      </div>

    </div>
  `
})
export class EscalaRodizioComponent {
  service = inject(CleanupService);

  // Estados reativos para Drag and Drop
  arrastandoMorador = signal<{ moradorId: string; origemSemanaId: string | null } | null>(null);
  semanaHover = signal<string | null>(null);
  menuEscalarAbertoPara = signal<string | null>(null);

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
    // Só limpa se estiver saindo da própria semana
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
      } catch {
        // Ignora erro de parsing
      }
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

  moradoresNaoEscalados(semana: EscalaSemana): Morador[] {
    const escaladosIds = new Set((semana.responsaveis || []).map(m => m.id));
    return this.service.moradores().filter(m => !escaladosIds.has(m.id));
  }

  formatarDataCurta(data: any): string {
    const d = new Date(data);
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${dia}/${mes}`;
  }
}
