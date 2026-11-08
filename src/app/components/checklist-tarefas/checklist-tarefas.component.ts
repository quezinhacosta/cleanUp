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
    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 transition-all duration-200 hover:shadow-md">
      
      <!-- Header do Módulo -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div class="flex items-center space-x-2.5">
            <h3 class="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center">
              <span class="w-3 h-3 rounded-full bg-blue-600 mr-2.5 shrink-0"></span>
              Checklist de Tarefas da Semana
            </h3>
            <span class="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {{ service.progressoSemana().concluidas }}/{{ service.progressoSemana().total }}
            </span>
          </div>
          <p class="text-sm sm:text-base text-slate-500 mt-1">
            Clique na tarefa para registrar a conclusão com carimbo de data e hora
          </p>
        </div>

        <!-- Ações do Cabeçalho -->
        <div class="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            (click)="solicitarReiniciarCiclo()"
            class="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-all border border-slate-200 shadow-2xs active:scale-95 cursor-pointer"
            title="Desmarcar todas as tarefas e reiniciar ciclo"
          >
            <svg class="w-4 h-4 mr-1.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reiniciar Tarefas
          </button>

          <!-- Botão Adicionar Tarefa -->
          <button
            type="button"
            (click)="alternarModalAdicionar()"
            class="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-sm sm:text-base transition-all border border-blue-200 shadow-2xs active:scale-95 cursor-pointer"
          >
            <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Nova Tarefa
          </button>
        </div>
      </div>

      <!-- Filtro por Cômodo -->
      <div class="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar border-b border-slate-100">
        @for (comodo of service.comodos(); track comodo) {
          <button
            type="button"
            (click)="service.setFiltroComodo(comodo)"
            class="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer"
            [class.bg-blue-600]="service.filtroComodo() === comodo"
            [class.text-white]="service.filtroComodo() === comodo"
            [class.shadow-2xs]="service.filtroComodo() === comodo"
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
            class="py-3.5 sm:py-4 flex items-center justify-between gap-3 group transition-colors rounded-2xl px-2.5 hover:bg-slate-50/90"
            [class.opacity-75]="tarefa.concluida"
          >
            <!-- Checkbox Customizado + Detalhes -->
            <label [for]="'tarefa-' + tarefa.id" class="flex items-start sm:items-center space-x-3.5 flex-1 cursor-pointer select-none">
              <div class="relative flex items-center justify-center mt-0.5 sm:mt-0">
                <input
                  type="checkbox"
                  [id]="'tarefa-' + tarefa.id"
                  [checked]="tarefa.concluida"
                  (change)="alternar(tarefa.id)"
                  class="sr-only"
                />
                <div
                  class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-200 shadow-2xs"
                  [class.bg-emerald-500]="tarefa.concluida"
                  [class.border-emerald-500]="tarefa.concluida"
                  [class.text-white]="tarefa.concluida"
                  [class.border-slate-300]="!tarefa.concluida"
                  [class.group-hover:border-blue-400]="!tarefa.concluida"
                  [class.bg-white]="!tarefa.concluida"
                  [class.scale-105]="tarefa.concluida"
                >
                  @if (tarefa.concluida) {
                    <svg class="w-5 h-5 stroke-[3] animate-in zoom-in-50 duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  }
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="text-base sm:text-lg font-bold transition-all"
                    [class.line-through]="tarefa.concluida"
                    [class.text-slate-400]="tarefa.concluida"
                    [class.text-slate-900]="!tarefa.concluida"
                  >
                    {{ tarefa.titulo }}
                  </span>

                  <!-- Badge do Cômodo -->
                  <span
                    class="text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider"
                    [ngClass]="getBadgeComodo(tarefa.comodo)"
                  >
                    {{ tarefa.comodo }}
                  </span>
                </div>

                <!-- Info do Último Registro (se concluída) -->
                @if (tarefa.concluida && getUltimoRegistro(tarefa.titulo); as reg) {
                  <p class="text-xs sm:text-sm text-emerald-700 mt-1 flex items-center font-medium">
                    <svg class="w-3.5 h-3.5 mr-1 text-emerald-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Concluído por <strong class="font-bold text-slate-800">&nbsp;{{ reg.moradorNome }}&nbsp;</strong> às {{ formatarHora(reg.dataHora) }}
                  </p>
                }
              </div>
            </label>

            <!-- Ações Rápidas (Excluir com Confirmação) -->
            <button
              type="button"
              (click)="solicitarRemover(tarefa)"
              class="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-all p-2 rounded-xl hover:bg-rose-50 cursor-pointer"
              [title]="'Excluir tarefa ' + tarefa.titulo"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        } @empty {
          <div class="py-12 text-center text-slate-400">
            <svg class="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p class="text-base font-semibold text-slate-600">Nenhuma tarefa encontrada neste filtro.</p>
          </div>
        }
      </div>

      <!-- Modal Adicionar Nova Tarefa -->
      @if (modalAberto()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div class="absolute inset-0" (click)="alternarModalAdicionar()"></div>

          <div class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 z-10 animate-in zoom-in-95 duration-150">
            <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 class="text-xl font-extrabold text-slate-900 tracking-tight">Nova Tarefa</h3>
              <button
                type="button"
                (click)="alternarModalAdicionar()"
                class="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div class="space-y-4 mt-5">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1.5">
                  Título da Tarefa
                </label>
                <input
                  type="text"
                  [(ngModel)]="novoTitulo"
                  placeholder="Ex: Lavar panos de prato"
                  class="w-full text-base px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
                  (keydown.enter)="solicitarSalvarNovaTarefa()"
                />
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1.5">
                  Cômodo
                </label>
                <select
                  [(ngModel)]="novoComodo"
                  class="w-full text-base px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
                >
                  <option value="Cozinha">Cozinha</option>
                  <option value="Banheiro">Banheiro</option>
                  <option value="Sala">Sala</option>
                  <option value="Corredor">Corredor</option>
                  <option value="Área de Serviço">Área de Serviço</option>
                  <option value="Varanda">Varanda</option>
                  <option value="Área Comum">Área Comum</option>
                </select>
              </div>

              <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  (click)="alternarModalAdicionar()"
                  class="py-2.5 px-4 rounded-xl text-slate-600 font-bold hover:bg-slate-100 text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  (click)="solicitarSalvarNovaTarefa()"
                  class="py-2.5 px-5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95 text-sm cursor-pointer"
                  [disabled]="!novoTitulo.trim()"
                >
                  Adicionar Tarefa
                </button>
              </div>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class ChecklistTarefasComponent {
  service = inject(CleanupService);

  modalAberto = signal<boolean>(false);
  novoTitulo = '';
  novoComodo: Tarefa['comodo'] = 'Cozinha';

  alternarModalAdicionar(): void {
    this.modalAberto.update(v => !v);
  }

  solicitarSalvarNovaTarefa(): void {
    const limpo = this.novoTitulo.trim();
    if (!limpo) return;

    this.service.solicitarConfirmacao({
      titulo: 'Tem certeza que deseja incluir?',
      mensagem: `Deseja adicionar a tarefa "${limpo}" no cômodo ${this.novoComodo}?`,
      tipo: 'incluir',
      textoBotaoConfirmar: 'Sim, incluir',
      acaoConfirmar: () => this.salvarNovaTarefa()
    });
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
      if (this.service.moradores().length > 0) {
        this.service.setMoradorAtivo(this.service.moradores()[0]);
      } else {
        this.service.abrirModalMembros();
        this.service.exibirToast('Cadastre ao menos um morador para registrar a limpeza.', 'aviso');
        return;
      }
    }

    this.service.alternarTarefa(id);
  }

  solicitarReiniciarCiclo(): void {
    this.service.solicitarConfirmacao({
      titulo: 'Tem certeza que deseja reiniciar as tarefas?',
      mensagem: 'Deseja desmarcar todas as tarefas e reiniciar o ciclo semanal?',
      tipo: 'aviso',
      textoBotaoConfirmar: 'Sim, reiniciar',
      acaoConfirmar: () => this.service.reiniciarCicloSemanal()
    });
  }

  solicitarRemover(tarefa: Tarefa): void {
    this.service.solicitarConfirmacao({
      titulo: 'Tem certeza que deseja excluir?',
      mensagem: `Tem certeza que deseja excluir a tarefa "${tarefa.titulo}" (${tarefa.comodo})?`,
      tipo: 'excluir',
      textoBotaoConfirmar: 'Sim, excluir',
      acaoConfirmar: () => this.remover(tarefa.id)
    });
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
