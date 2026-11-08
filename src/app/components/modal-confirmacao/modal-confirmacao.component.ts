import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CleanupService } from '../../services/cleanup.service';

@Component({
  selector: 'app-modal-confirmacao',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (service.confirmacaoPendente(); as pedido) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
        
        <!-- Backdrop para fechar ao clicar fora -->
        <div class="absolute inset-0" (click)="service.cancelarConfirmacao()"></div>

        <!-- Card da Confirmação -->
        <div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 z-10 animate-in zoom-in-95 duration-150 flex flex-col items-center text-center">
          
          <!-- Ícone do Tipo de Ação com Efeito Pulsante -->
          @switch (pedido.tipo) {
            @case ('excluir') {
              <div class="w-16 h-16 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-600 flex items-center justify-center mb-4 shadow-sm animate-bounce">
                <svg class="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            }
            @case ('incluir') {
              <div class="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mb-4 shadow-sm animate-pulse">
                <svg class="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </div>
            }
            @default {
              <div class="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-200 text-blue-600 flex items-center justify-center mb-4 shadow-sm">
                <svg class="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            }
          }

          <!-- Título da Confirmação (Letras Maiores) -->
          <h3 class="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {{ pedido.titulo }}
          </h3>

          <!-- Mensagem Detalhada -->
          <p class="text-base sm:text-lg text-slate-600 mt-2 mb-6 leading-relaxed">
            {{ pedido.mensagem }}
          </p>

          <!-- Botões de Ação -->
          <div class="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
            <button
              type="button"
              (click)="service.cancelarConfirmacao()"
              class="w-full sm:w-1/2 py-3 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 active:scale-95 transition-all text-base cursor-pointer"
            >
              Cancelar
            </button>

            @if (pedido.tipo === 'excluir') {
              <button
                type="button"
                (click)="service.confirmarAcao()"
                class="w-full sm:w-1/2 py-3 px-5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-md active:scale-95 transition-all text-base cursor-pointer"
              >
                {{ pedido.textoBotaoConfirmar || 'Sim, excluir' }}
              </button>
            } @else if (pedido.tipo === 'incluir') {
              <button
                type="button"
                (click)="service.confirmarAcao()"
                class="w-full sm:w-1/2 py-3 px-5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md active:scale-95 transition-all text-base cursor-pointer"
              >
                {{ pedido.textoBotaoConfirmar || 'Sim, incluir' }}
              </button>
            } @else {
              <button
                type="button"
                (click)="service.confirmarAcao()"
                class="w-full sm:w-1/2 py-3 px-5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md active:scale-95 transition-all text-base cursor-pointer"
              >
                {{ pedido.textoBotaoConfirmar || 'Sim, confirmar' }}
              </button>
            }
          </div>

        </div>
      </div>
    }
  `
})
export class ModalConfirmacaoComponent {
  service = inject(CleanupService);
}
