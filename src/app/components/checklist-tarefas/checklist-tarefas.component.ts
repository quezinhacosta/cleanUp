import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CleanupService } from '../../services/cleanup.service';
import { Tarefa } from '../../models/cleanup.model';

@Component({
  selector: 'app-checklist-tarefas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 transition-all duration-200 hover:shadow-md">
      
      <!-- Header do Módulo -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div class="flex items-center space-x-2">
            <h3 class="text-lg font-bold text-slate-900 tracking-tight flex items-center">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-600 mr-2"></span>
              Checklist de Tarefas da Semana
            </h3>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {{ service.progressoSemana().concluidas }}/{{ service.progressoSemana().total }}
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            Clique na tarefa para registrar a conclusão com carimbo de data e hora
          </p>
        </div>

        <!-- Botão Adicionar Tarefa -->
        <button
          type="button"
          (click)="alternarModalAdicionar()"
          class="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition-colors self-start sm:self-auto border border-blue-200"
        >
          <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nova Tarefa
        </button>
      </div>

      <!-- Filtro por Cômodo -->
      <div class="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar border-b border-slate-100">
        @for (comodo of service.comodos(); track comodo) {
          <button
            type="button"
            (click)="service.setFiltroComodo(comodo)"
            class="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
            [class.bg-blue-600]="service.filtroComodo() === comodo"
            [class.text-white]="service.filtroComodo() === comodo"
            [class.shadow-xs]="service.filtroComodo() === comodo"
            [class.bg-slate-100]="service.filtroComodo() !== comodo"
            [class.text-slate-600]="service.filtroComodo() !== comodo"
            [class.hover:bg-slate-200]="service.filtroComodo() !== comodo"
          >
            {{ comodo }}
          </button>
        }
      </div>

      <!-- Lista de Itens do Checklist -->
      <div class="divide-y divide-slate-100 mt-2">
        @for (tarefa of service.tarefasFiltradas(); track tarefa.id) {
          <div
            class="py-3 sm:py-3.5 flex items-center justify-between gap-3 group transition-colors rounded-xl px-2 hover:bg-slate-50/80"
            [class.opacity-70]="tarefa.concluida"
          >
            <!-- Checkbox Customizado + Detalhes -->
            <label [for]="'tarefa-' + tarefa.id" class="flex items-start sm:items-center space-x-3.5 flex-1 cursor-pointer">
              <div class="relative flex items-center justify-center mt-0.5 sm:mt-0">
                <input
                  type="checkbox"
                  [id]="'tarefa-' + tarefa.id"
                  [checked]="tarefa.concluida"
                  (change)="alternar(tarefa.id)"
                  class="sr-only"
                />
                <div
                  class="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200"
                  [class.bg-emerald-500]="tarefa.concluida"
                  [class.border-emerald-500]="tarefa.concluida"
                  [class.text-white]="tarefa.concluida"
                  [class.border-slate-300]="!tarefa.concluida"
                  [class.group-hover:border-blue-400]="!tarefa.concluida"
                  [class.bg-white]="!tarefa.concluida"
                >
                  @if (tarefa.concluida) {
                    <svg class="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  }
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span
                    class="text-sm font-medium transition-all"
                    [class.line-through]="tarefa.concluida"
                    [class.text-slate-400]="tarefa.concluida"
                    [class.text-slate-800]="!tarefa.concluida"
                  >
                    {{ tarefa.titulo }}
                  </span>

                  <!-- Badge do Cômodo -->
                  <span
                    class="text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider"
                    [ngClass]="getBadgeComodo(tarefa.comodo)"
                  >
                    {{ tarefa.comodo }}
                  </span>
                </div>

                <!-- Info do Último Registro (se concluída) -->
                @if (tarefa.concluida && getUltimoRegistro(tarefa.titulo); as reg) {
                  <p class="text-[11px] text-emerald-600 mt-0.5 flex items-center">
                    <svg class="w-3 h-3 mr-1 text-emerald-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Concluído por <strong>&nbsp;{{ reg.moradorNome }}&nbsp;</strong> às {{ formatarHora(reg.dataHora) }}
                  </p>
                }
              </div>
            </label>

            <!-- Ações Rápidas (Excluir) -->
            <button
              type="button"
              (click)="remover(tarefa.id)"
              class="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity p-1.5 rounded-lg hover:bg-rose-50"
              title="Remover tarefa"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        } @empty {
          <div class="py-10 text-center">
            <svg class="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p class="text-xs text-slate-500">Nenhuma tarefa encontrada neste filtro.</p>
          </div>
        }
      </div>

      <!-- Feedback de Registro Rápido -->
      @if (ultimoAviso()) {
        <div class="mt-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ ultimoAviso() }}</span>
          </div>
          <button (click)="ultimoAviso.set(null)" class="text-emerald-700 hover:text-emerald-900 ml-2">✕</button>
        </div>
      }

      <!-- Modal Nova Tarefa -->
      @if (modalAberto()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 class="text-base font-bold text-slate-900">Cadastrar Nova Tarefa</h4>
              <button (click)="alternarModalAdicionar()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div class="mt-4 space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Título da Tarefa</label>
                <input
                  type="text"
                  [(ngModel)]="novoTitulo"
                  placeholder="Ex: Limpar geladeira por dentro"
                  class="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Cômodo / Setor</label>
                <select
                  [(ngModel)]="novoComodo"
                  class="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="Sala">Sala</option>
                  <option value="Corredor">Corredor</option>
                  <option value="Banheiro">Banheiro</option>
                  <option value="Cozinha">Cozinha</option>
                  <option value="Área de Serviço">Área de Serviço</option>
                  <option value="Varanda">Varanda</option>
                  <option value="Área Comum">Área Comum</option>
                </select>
              </div>
            </div>

            <div class="mt-6 flex items-center justify-end space-x-2">
              <button
                type="button"
                (click)="alternarModalAdicionar()"
                class="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="salvarNovaTarefa()"
                [disabled]="!novoTitulo.trim()"
                class="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs"
              >
                Adicionar Tarefa
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class ChecklistTarefasComponent {
  service = inject(CleanupService);

  modalAberto = signal(false);
  novoTitulo = '';
  novoComodo: Tarefa['comodo'] = 'Cozinha';
  ultimoAviso = signal<string | null>(null);

  alternarModalAdicionar(): void {
    this.modalAberto.update(v => !v);
  }

  salvarNovaTarefa(): void {
    if (!this.novoTitulo.trim()) return;
    this.service.adicionarTarefa(this.novoTitulo, this.novoComodo);
    this.novoTitulo = '';
    this.modalAberto.set(false);
  }

  alternar(id: string): void {
    const tarefa = this.service.tarefas().find(t => t.id === id);
    if (!tarefa) return;

    const seraConcluida = !tarefa.concluida;
    const ativo = this.service.moradorAtivo();

    if (seraConcluida && !ativo) {
      this.service.abrirModalMembros();
      this.ultimoAviso.set('Por favor, cadastre ao menos um morador para registrar a limpeza.');
      setTimeout(() => {
        if (this.ultimoAviso()) this.ultimoAviso.set(null);
      }, 4000);
      return;
    }

    this.service.alternarTarefa(id);

    if (seraConcluida && ativo) {
      const horaStr = new Date().toLocaleTimeString('pt-BR');
      this.ultimoAviso.set(`"${tarefa.titulo}" registrada por ${ativo.nome} às ${horaStr}!`);
      setTimeout(() => {
        if (this.ultimoAviso()) this.ultimoAviso.set(null);
      }, 4000);
    }
  }

  remover(id: string): void {
    this.service.removerTarefa(id);
  }

  getUltimoRegistro(tarefaNome: string) {
    return this.service.historico().find(h => h.tarefaNome === tarefaNome);
  }

  formatarHora(data: Date): string {
    const d = new Date(data);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  getBadgeComodo(comodo: Tarefa['comodo']): string {
    switch (comodo) {
      case 'Sala':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'Corredor':
        return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'Banheiro':
        return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
      case 'Cozinha':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Área de Serviço':
        return 'bg-teal-50 text-teal-700 border border-teal-200';
      case 'Varanda':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Área Comum':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  }
}

