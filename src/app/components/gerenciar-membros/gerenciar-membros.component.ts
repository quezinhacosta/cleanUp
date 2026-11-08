import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CleanupService } from '../../services/cleanup.service';
import { RelatorioPdfService } from '../../services/relatorio-pdf.service';
import { Morador } from '../../models/cleanup.model';

@Component({
  selector: 'app-gerenciar-membros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (service.modalMembrosAberto()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
          
          <!-- Cabeçalho -->
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-base shadow-2xs">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-extrabold text-slate-900 tracking-tight">Gerenciar Membros</h3>
                <p class="text-xs sm:text-sm text-slate-500">Adicione ou remova os moradores que participam da escala</p>
              </div>
            </div>

            <button
              type="button"
              (click)="service.fecharModalMembros()"
              class="text-slate-400 hover:text-slate-700 text-lg font-bold p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Formulário para Adicionar Novo Membro -->
          <div class="mt-5 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
            <h4 class="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-3">
              Cadastrar Novo Membro
            </h4>
            
            <div class="space-y-3.5">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1.5">Nome Completo *</label>
                <input
                  type="text"
                  [(ngModel)]="novoNome"
                  placeholder="Ex: Quezia Costa"
                  (keyup.enter)="solicitarAdicionar()"
                  class="w-full text-base px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>

              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <span class="text-xs text-slate-500">
                  O rodízio é atualizado automaticamente.
                </span>
                <button
                  type="button"
                  (click)="solicitarAdicionar()"
                  [disabled]="!novoNome.trim()"
                  class="w-full sm:w-auto text-center px-5 py-2.5 text-sm sm:text-base font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  Adicionar Membro
                </button>
              </div>
            </div>
          </div>

          <!-- Lista de Membros Cadastrados -->
          <div class="mt-5 flex-1 overflow-y-auto pr-1">
            <div class="flex items-center justify-between mb-2.5">
              <span class="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-wide">
                Membros Cadastrados ({{ service.moradores().length }})
              </span>
            </div>

            <div class="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              @for (morador of service.moradores(); track morador.id) {
                <div class="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div class="flex items-center space-x-3.5">
                    <img
                      [src]="morador.avatarUrl || 'https://ui-avatars.com/api/?name=' + morador.nome"
                      [alt]="morador.nome"
                      class="w-10 h-10 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                    />
                    <div>
                      <p class="text-sm sm:text-base font-bold text-slate-900">{{ morador.nome }}</p>
                      @if (morador.id === service.moradorAtivo()?.id) {
                        <span class="inline-flex items-center text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md mt-0.5">
                          <span class="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5"></span>
                          Selecionado no momento
                        </span>
                      }
                    </div>
                  </div>

                  <div class="flex items-center space-x-2">
                    <button
                      type="button"
                      (click)="baixarPdf(morador)"
                      class="text-xs font-bold text-blue-700 hover:text-blue-800 px-2.5 py-1.5 rounded-xl hover:bg-blue-50 transition-colors flex items-center space-x-1 border border-blue-200 cursor-pointer"
                      title="Baixar relatório em PDF deste membro"
                    >
                      <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>PDF</span>
                    </button>

                    <button
                      type="button"
                      (click)="solicitarExcluir(morador)"
                      class="text-xs font-bold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 transition-colors border border-rose-200 cursor-pointer"
                      [title]="'Excluir morador ' + morador.nome"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="p-8 text-center text-slate-400">
                  <p class="text-sm font-semibold text-slate-600">Nenhum membro cadastrado ainda.</p>
                  <p class="text-xs text-slate-400 mt-1">Utilize o formulário acima para adicionar os moradores.</p>
                </div>
              }
            </div>
          </div>

          <!-- Rodapé do Modal -->
          <div class="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              (click)="service.fecharModalMembros()"
              class="px-5 py-2.5 text-sm sm:text-base font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Concluir
            </button>
          </div>

        </div>
      </div>
    }
  `
})
export class GerenciarMembrosComponent {
  service = inject(CleanupService);
  pdfService = inject(RelatorioPdfService);

  novoNome = '';
  novoAvatar = '';

  baixarPdf(morador: Morador): void {
    const moradorExiste = this.service.moradores().some(m => m.id === morador.id);
    if (!moradorExiste) {
      this.service.exibirToast('Não é possível emitir relatório: este usuário foi excluído do sistema.', 'erro');
      return;
    }
    this.pdfService.gerarRelatorioMorador(
      morador,
      this.service.historico(),
      this.service.tarefas()
    );
  }

  solicitarAdicionar(): void {
    const nome = this.novoNome.trim();
    if (!nome) return;

    this.service.solicitarConfirmacao({
      titulo: 'Tem certeza que deseja incluir?',
      mensagem: `Deseja cadastrar o morador "${nome}" na escala do CleanUp?`,
      tipo: 'incluir',
      textoBotaoConfirmar: 'Sim, incluir',
      acaoConfirmar: () => this.adicionar()
    });
  }

  adicionar(): void {
    if (!this.novoNome.trim()) return;

    const nome = this.novoNome.trim();
    this.service.adicionarMorador(nome, this.novoAvatar.trim() || undefined);
    this.novoNome = '';
    this.novoAvatar = '';
  }

  solicitarExcluir(morador: Morador): void {
    this.service.solicitarConfirmacao({
      titulo: 'Tem certeza que deseja excluir?',
      mensagem: `Tem certeza que deseja excluir o morador "${morador.nome}"? Todos os registros, tarefas e histórico associados a ele serão permanentemente apagados.`,
      tipo: 'excluir',
      textoBotaoConfirmar: 'Sim, excluir',
      acaoConfirmar: () => this.service.removerMorador(morador.id)
    });
  }
}
