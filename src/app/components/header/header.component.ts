import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CleanupService } from '../../services/cleanup.service';
import { Morador } from '../../models/cleanup.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div class="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div class="flex items-center justify-between h-16">
          
          <!-- Logo & Badges -->
          <div class="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div class="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20 shrink-0">
              <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <div class="min-w-0">
              <div class="flex items-center space-x-2">
                <span class="text-lg sm:text-xl font-bold tracking-tight text-slate-900">Clean<span class="text-blue-600">Up</span></span>
                @if (service.moradores().length > 0) {
                  <span class="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 badge-pulse"></span>
                    Plantão Ativo
                  </span>
                } @else {
                  <span class="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Sem Membros
                  </span>
                }
              </div>
              <p class="text-[11px] sm:text-xs text-slate-500 hidden sm:block truncate">
                Transparência e escala de limpeza &bull; Feito por <strong>Quezia Costa</strong>
              </p>
            </div>
          </div>

          <!-- Ações da Direita: Gerenciar Membros + Seletor de Perfil -->
          <div class="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            
            <!-- Botão Gerenciar Membros -->
            <button
              type="button"
              (click)="service.abrirModalMembros()"
              class="inline-flex items-center px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <svg class="w-4 h-4 sm:mr-1.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span class="hidden sm:inline">Membros</span>
              <span class="sm:ml-1.5 bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">
                {{ service.moradores().length }}
              </span>
            </button>

            <!-- Seletor do Morador Ativo com Toggle de Clique -->
            @if (service.moradores().length > 0) {
              <div class="relative">
                <button
                  type="button"
                  (click)="alternarMenuPerfis()"
                  class="flex items-center space-x-1.5 sm:space-x-2 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 transition-colors py-1.5 px-2.5 sm:px-3 rounded-full border border-slate-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  @if (service.moradorAtivo(); as ativo) {
                    <img
                      [src]="ativo.avatarUrl || 'https://ui-avatars.com/api/?name=' + ativo.nome"
                      [alt]="ativo.nome"
                      class="w-6 h-6 rounded-full object-cover border border-white shadow-xs shrink-0"
                    />
                    <span class="text-xs font-bold text-slate-800 max-w-[80px] xs:max-w-[100px] sm:max-w-none truncate">
                      {{ ativo.nome }}
                    </span>
                  } @else {
                    <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                      ?
                    </div>
                    <span class="text-xs font-semibold text-slate-700">
                      Selecionar Perfil
                    </span>
                  }
                  <svg
                    class="w-3.5 h-3.5 text-slate-500 transition-transform duration-200 shrink-0"
                    [class.rotate-180]="menuPerfisAberto()"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- Dropdown Menu com Controle Explícito de Clique -->
                @if (menuPerfisAberto()) {
                  <!-- Backdrop invisível para fechar ao clicar fora -->
                  <div class="fixed inset-0 z-40" (click)="fecharMenuPerfis()"></div>

                  <div class="absolute right-0 mt-2 w-60 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div class="px-3 py-1.5 border-b border-slate-100">
                      <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trocar de Perfil</p>
                      <p class="text-[10px] text-slate-500">Selecione quem está usando o app agora</p>
                    </div>

                    <div class="max-h-60 overflow-y-auto">
                      @for (m of service.moradores(); track m.id) {
                        <button
                          type="button"
                          (click)="selecionarMorador(m)"
                          class="w-full flex items-center space-x-3 px-3 py-2.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer text-left"
                          [class.bg-blue-50]="m.id === service.moradorAtivo()?.id"
                          [class.text-blue-700]="m.id === service.moradorAtivo()?.id"
                          [class.font-bold]="m.id === service.moradorAtivo()?.id"
                        >
                          <img
                            [src]="m.avatarUrl || 'https://ui-avatars.com/api/?name=' + m.nome"
                            [alt]="m.nome"
                            class="w-6 h-6 rounded-full object-cover"
                          />
                          <span class="flex-1 truncate">{{ m.nome }}</span>
                          @if (m.id === service.moradorAtivo()?.id) {
                            <span class="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-semibold">Ativo</span>
                          }
                        </button>
                      }
                    </div>

                    <div class="border-t border-slate-100 mt-1 pt-1">
                      <button
                        type="button"
                        (click)="abrirModalMembrosEFecharMenu()"
                        class="w-full flex items-center space-x-2 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 font-semibold cursor-pointer"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Gerenciar / Novo Membro</span>
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <button
                type="button"
                (click)="service.abrirModalMembros()"
                class="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                + Adicionar Membro
              </button>
            }

          </div>

        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  service = inject(CleanupService);
  menuPerfisAberto = signal(false);

  alternarMenuPerfis(): void {
    this.menuPerfisAberto.update(v => !v);
  }

  fecharMenuPerfis(): void {
    this.menuPerfisAberto.set(false);
  }

  selecionarMorador(morador: Morador): void {
    this.service.setMoradorAtivo(morador);
    this.fecharMenuPerfis();
  }

  abrirModalMembrosEFecharMenu(): void {
    this.fecharMenuPerfis();
    this.service.abrirModalMembros();
  }
}
