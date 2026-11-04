import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CleanupService } from '../../services/cleanup.service';

@Component({
  selector: 'app-gerenciar-membros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (service.modalMembrosAberto()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
          
          <!-- Cabeçalho -->
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div class="flex items-center space-x-2.5">
              <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900">Gerenciar Membros do Apartamento</h3>
                <p class="text-xs text-slate-500">Adicione ou remova os moradores que participam da escala</p>
              </div>
            </div>

            <button
              type="button"
              (click)="service.fecharModalMembros()"
              class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
            >
              ✕
            </button>
          </div>

          <!-- Formulário para Adicionar Novo Membro -->
          <div class="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">Cadastrar Novo Membro</h4>
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  [(ngModel)]="novoNome"
                  placeholder="Ex: Quezia Costa"
                  (keyup.enter)="adicionar()"
                  class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">URL da Foto (opcional)</label>
                <input
                  type="url"
                  [(ngModel)]="novoAvatar"
                  placeholder="https://... (deixe vazio para avatar automático)"
                  (keyup.enter)="adicionar()"
                  class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>

              <div class="flex items-center justify-between pt-1">
                <span class="text-[11px] text-slate-500">
                  O rodízio da escala é atualizado automaticamente ao adicionar.
                </span>
                <button
                  type="button"
                  (click)="adicionar()"
                  [disabled]="!novoNome.trim()"
                  class="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
                >
                  Adicionar Membro
                </button>
              </div>
            </div>
          </div>

          <!-- Aviso de Feedback Rápido -->
          @if (mensagemFeedback()) {
            <div class="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
              <span>{{ mensagemFeedback() }}</span>
              <button (click)="mensagemFeedback.set(null)" class="text-emerald-700 hover:text-emerald-900 ml-2">✕</button>
            </div>
          }

          <!-- Lista de Membros Cadastrados -->
          <div class="mt-4 flex-1 overflow-y-auto">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Membros Atuais ({{ service.moradores().length }})
              </span>
            </div>

            <div class="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
              @for (morador of service.moradores(); track morador.id) {
                <div class="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div class="flex items-center space-x-3">
                    <img
                      [src]="morador.avatarUrl || 'https://ui-avatars.com/api/?name=' + morador.nome"
                      [alt]="morador.nome"
                      class="w-9 h-9 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <p class="text-xs font-bold text-slate-800">{{ morador.nome }}</p>
                      @if (morador.id === service.moradorAtivo()?.id) {
                        <span class="inline-flex items-center text-[10px] text-blue-600 font-medium">
                          <span class="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1"></span>
                          Selecionado no momento
                        </span>
                      }
                    </div>
                  </div>

                  <div class="flex items-center space-x-2">
                    <button
                      type="button"
                      (click)="service.removerMorador(morador.id)"
                      class="text-xs text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors font-medium"
                      title="Remover membro"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="p-8 text-center text-slate-400">
                  <p class="text-xs">Nenhum membro cadastrado ainda.</p>
                  <p class="text-[11px] text-slate-400 mt-1">Utilize o formulário acima para adicionar os moradores.</p>
                </div>
              }
            </div>
          </div>

          <!-- Rodapé do Modal -->
          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              (click)="service.fecharModalMembros()"
              class="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
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

  novoNome = '';
  novoAvatar = '';
  mensagemFeedback = signal<string | null>(null);

  adicionar(): void {
    if (!this.novoNome.trim()) return;

    const nome = this.novoNome.trim();
    this.service.adicionarMorador(nome, this.novoAvatar.trim() || undefined);
    this.novoNome = '';
    this.novoAvatar = '';
    this.mensagemFeedback.set(`Membro "${nome}" adicionado com sucesso!`);

    setTimeout(() => {
      if (this.mensagemFeedback()) this.mensagemFeedback.set(null);
    }, 3500);
  }
}

