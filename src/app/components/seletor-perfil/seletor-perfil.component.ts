import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CleanupService } from '../../services/cleanup.service';
import { Morador } from '../../models/cleanup.model';

@Component({
  selector: 'app-seletor-perfil',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h3 class="text-sm font-bold text-slate-900 flex items-center">
            <span class="w-2 h-2 rounded-full bg-blue-600 mr-2"></span>
            Quem está limpando agora?
          </h3>
          <p class="text-xs text-slate-500">
            Selecione seu nome para assinar com precisão de segundos as tarefas que você concluir
          </p>
        </div>

        <button
          type="button"
          (click)="service.abrirModalMembros()"
          class="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 self-start sm:self-auto"
        >
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Adicionar / Gerenciar Membros
        </button>
      </div>

      <!-- Barra de Chips de Perfis -->
      <div class="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
        @for (morador of service.moradores(); track morador.id) {
          <button
            type="button"
            (click)="selecionar(morador)"
            class="flex items-center space-x-2.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all flex-shrink-0 cursor-pointer"
            [class.bg-blue-50]="morador.id === service.moradorAtivo()?.id"
            [class.border-blue-500]="morador.id === service.moradorAtivo()?.id"
            [class.text-blue-900]="morador.id === service.moradorAtivo()?.id"
            [class.ring-2]="morador.id === service.moradorAtivo()?.id"
            [class.ring-blue-500/20]="morador.id === service.moradorAtivo()?.id"
            [class.shadow-2xs]="morador.id === service.moradorAtivo()?.id"
            [class.bg-slate-50]="morador.id !== service.moradorAtivo()?.id"
            [class.border-slate-200]="morador.id !== service.moradorAtivo()?.id"
            [class.text-slate-700]="morador.id !== service.moradorAtivo()?.id"
            [class.hover:bg-slate-100]="morador.id !== service.moradorAtivo()?.id"
          >
            <div class="relative">
              <img
                [src]="morador.avatarUrl || 'https://ui-avatars.com/api/?name=' + morador.nome"
                [alt]="morador.nome"
                class="w-7 h-7 rounded-full object-cover border border-white"
              />
              @if (morador.id === service.moradorAtivo()?.id) {
                <span class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white flex items-center justify-center">
                  <svg class="w-2 h-2 text-white stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              }
            </div>

            <div class="text-left">
              <div class="font-bold truncate max-w-[120px]">{{ morador.nome }}</div>
              @if (morador.id === service.moradorAtivo()?.id) {
                <div class="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Ativo Agora</div>
              } @else {
                <div class="text-[10px] text-slate-400">Clique para assumir</div>
              }
            </div>
          </button>
        } @empty {
          <div class="flex items-center space-x-2 text-xs text-slate-500 py-1">
            <span>Nenhum perfil cadastrado.</span>
            <button
              type="button"
              (click)="service.abrirModalMembros()"
              class="font-semibold text-blue-600 hover:underline"
            >
              Clique aqui para adicionar os moradores do apartamento.
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class SeletorPerfilComponent {
  service = inject(CleanupService);

  selecionar(morador: Morador): void {
    this.service.setMoradorAtivo(morador);
  }
}

