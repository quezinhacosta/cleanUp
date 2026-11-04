import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CleanupService } from '../../services/cleanup.service';
import { Morador } from '../../models/cleanup.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          
          <!-- Logo & Badges -->
          <div class="flex items-center space-x-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <span class="text-xl font-bold tracking-tight text-slate-900">Clean<span class="text-blue-600">Up</span></span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 badge-pulse"></span>
                  Plantão Ativo
                </span>
              </div>
              <p class="text-xs text-slate-500 hidden sm:block">Transparência e escala de limpeza do apartamento</p>
            </div>
          </div>

          <!-- Morador Ativo / Switcher -->
          <div class="flex items-center space-x-3">
            <div class="flex items-center text-xs text-slate-500 mr-1 hidden md:block">
              Registrando como:
            </div>
            
            <div class="relative group">
              <button
                type="button"
                class="flex items-center space-x-2.5 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 transition-colors py-1.5 px-3 rounded-full border border-slate-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <img
                  [src]="service.moradorAtivo().avatarUrl || 'https://ui-avatars.com/api/?name=' + service.moradorAtivo().nome"
                  [alt]="service.moradorAtivo().nome"
                  class="w-7 h-7 rounded-full object-cover border border-white shadow-xs"
                />
                <span class="text-xs font-medium text-slate-800 font-medium max-w-[110px] sm:max-w-none truncate">
                  {{ service.moradorAtivo().nome }}
                </span>
                <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Dropdown Menu -->
              <div class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 hidden group-hover:block hover:block z-50">
                <div class="px-3 py-1.5 border-b border-slate-100">
                  <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Alternar Morador</p>
                </div>
                @for (m of service.moradores(); track m.id) {
                  <button
                    type="button"
                    (click)="selecionarMorador(m)"
                    class="w-full flex items-center space-x-3 px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    [class.bg-blue-50]="m.id === service.moradorAtivo().id"
                    [class.text-blue-700]="m.id === service.moradorAtivo().id"
                    [class.font-semibold]="m.id === service.moradorAtivo().id"
                  >
                    <img
                      [src]="m.avatarUrl || 'https://ui-avatars.com/api/?name=' + m.nome"
                      [alt]="m.nome"
                      class="w-6 h-6 rounded-full object-cover"
                    />
                    <span class="flex-1 text-left truncate">{{ m.nome }}</span>
                    @if (m.id === service.moradorAtivo().id) {
                      <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    }
                  </button>
                }
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  service = inject(CleanupService);

  selecionarMorador(morador: Morador): void {
    this.service.setMoradorAtivo(morador);
  }
}

