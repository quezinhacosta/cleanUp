import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CleanupService } from '../../services/cleanup.service';
import { Morador } from '../../models/cleanup.model';

@Component({
  selector: 'app-seletor-perfil',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 transition-all duration-200 hover:shadow-md">
      
      <!-- Cabeçalho -->
      <div class="flex items-start justify-between gap-3 mb-4 pb-3.5 border-b border-slate-100">
        <div>
          <h3 class="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center">
            <span class="w-3 h-3 rounded-full bg-blue-600 mr-2 shrink-0 animate-pulse"></span>
            Quem está limpando agora?
          </h3>
          <p class="text-xs sm:text-sm text-slate-500 mt-1">
            Selecione seu perfil para assinar as tarefas com data e hora exata.
          </p>
        </div>

        <button
          type="button"
          (click)="service.abrirModalMembros()"
          class="inline-flex items-center text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded-lg transition-colors shrink-0 cursor-pointer"
          title="Adicionar ou gerenciar moradores"
        >
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Membros
        </button>
      </div>

      <!-- Morador Ativo em Destaque Visual (Se houver) -->
      @if (service.moradorAtivo(); as ativo) {
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200/80 mb-4 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="relative">
              <img
                [src]="ativo.avatarUrl || 'https://ui-avatars.com/api/?name=' + ativo.nome"
                [alt]="ativo.nome"
                class="w-11 h-11 rounded-2xl object-cover ring-2 ring-blue-500/30 shadow-xs"
              />
              <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></span>
            </div>
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                Perfil Selecionado
              </span>
              <p class="text-base sm:text-lg font-extrabold text-slate-900 leading-tight mt-0.5">
                {{ ativo.nome }}
              </p>
            </div>
          </div>

          <span class="text-xs font-semibold text-blue-600 bg-white px-2.5 py-1 rounded-xl shadow-2xs border border-blue-100">
            Ativo
          </span>
        </div>
      }

      <!-- Lista Vertical de Perfis -->
      <div class="space-y-2 max-h-80 overflow-y-auto pr-1">
        @for (morador of service.moradores(); track morador.id) {
          <button
            type="button"
            (click)="selecionar(morador)"
            class="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-sm sm:text-base font-semibold transition-all cursor-pointer group text-left"
            [class.bg-blue-50]="morador.id === service.moradorAtivo()?.id"
            [class.border-blue-500]="morador.id === service.moradorAtivo()?.id"
            [class.text-blue-950]="morador.id === service.moradorAtivo()?.id"
            [class.ring-2]="morador.id === service.moradorAtivo()?.id"
            [class.ring-blue-500/20]="morador.id === service.moradorAtivo()?.id"
            [class.shadow-xs]="morador.id === service.moradorAtivo()?.id"
            [class.bg-white]="morador.id !== service.moradorAtivo()?.id"
            [class.border-slate-200]="morador.id !== service.moradorAtivo()?.id"
            [class.text-slate-800]="morador.id !== service.moradorAtivo()?.id"
            [class.hover:bg-slate-50]="morador.id !== service.moradorAtivo()?.id"
            [class.hover:border-slate-300]="morador.id !== service.moradorAtivo()?.id"
          >
            <div class="flex items-center space-x-3 min-w-0">
              <div class="relative shrink-0">
                <img
                  [src]="morador.avatarUrl || 'https://ui-avatars.com/api/?name=' + morador.nome"
                  [alt]="morador.nome"
                  class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-slate-200"
                />
                @if (morador.id === service.moradorAtivo()?.id) {
                  <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                    <svg class="w-2.5 h-2.5 text-white stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                }
              </div>

              <div class="min-w-0">
                <p class="truncate font-bold text-sm sm:text-base leading-tight">
                  {{ morador.nome }}
                </p>
                <p class="text-xs font-normal text-slate-400 mt-0.5">
                  {{ morador.id === service.moradorAtivo()?.id ? 'Assinando tarefas' : 'Clique para selecionar' }}
                </p>
              </div>
            </div>

            <!-- Indicador Lateral -->
            @if (morador.id === service.moradorAtivo()?.id) {
              <span class="text-blue-600 shrink-0 font-bold text-xs bg-white py-1 px-2.5 rounded-lg border border-blue-200">
                Em uso
              </span>
            } @else {
              <span class="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            }
          </button>
        } @empty {
          <div class="text-center py-6 text-slate-400">
            <svg class="w-9 h-9 mx-auto mb-1 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p class="text-sm font-semibold text-slate-600">Nenhum morador cadastrado.</p>
            <button
              type="button"
              (click)="service.abrirModalMembros()"
              class="mt-2 text-xs font-bold text-blue-600 hover:underline"
            >
              + Cadastrar Moradores
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
