import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CleanupService } from '../../services/cleanup.service';
import { EscalaSemana } from '../../models/cleanup.model';

@Component({
  selector: 'app-escala-rodizio',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 transition-all duration-200 hover:shadow-md">
      
      <!-- Cabeçalho da Escala -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <div class="flex items-center space-x-2">
            <h3 class="text-lg font-bold text-slate-900 tracking-tight flex items-center">
              <span class="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></span>
              Visão da Escala de Rodízio
            </h3>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Próximos Ciclos
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            Ordem planejada dos moradores para garantir revezamento justo
          </p>
        </div>
      </div>

      <!-- Grid de Semanas da Escala -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        @for (semana of service.escala(); track semana.semanaId; let i = $index) {
          <div
            class="rounded-xl border p-4 transition-all flex flex-col justify-between"
            [class.border-blue-300]="i === 0"
            [class.bg-blue-50/30]="i === 0"
            [class.shadow-xs]="i === 0"
            [class.border-slate-200]="i > 0"
            [class.bg-white]="i > 0"
          >
            <div>
              <!-- Topo do Card: Badge de Semana & Status -->
              <div class="flex items-center justify-between mb-3">
                <span
                  class="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                  [class.bg-blue-600]="i === 0"
                  [class.text-white]="i === 0"
                  [class.bg-slate-100]="i > 0"
                  [class.text-slate-600]="i > 0"
                >
                  {{ i === 0 ? 'Semana Atual' : 'Semana ' + (i + 1) }}
                </span>

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

              <!-- Morador Responsável -->
              <div class="flex items-center space-x-3 mb-3">
                <img
                  [src]="semana.responsavel.avatarUrl || 'https://ui-avatars.com/api/?name=' + semana.responsavel.nome"
                  [alt]="semana.responsavel.nome"
                  class="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div class="min-w-0">
                  <h4 class="text-sm font-bold text-slate-800 truncate">
                    {{ semana.responsavel.nome }}
                  </h4>
                  <p class="text-[11px] text-slate-500">
                    {{ i === 0 ? 'Plantão em vigor' : 'Próximo na fila' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Rodapé do Card: Datas -->
            <div class="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span class="flex items-center">
                <svg class="w-3.5 h-3.5 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ formatarDataCurta(semana.dataInicio) }} - {{ formatarDataCurta(semana.dataFim) }}
              </span>
            </div>

          </div>
        } @empty {
          <div class="col-span-full py-8 text-center text-slate-400">
            <svg class="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-xs">Nenhum membro cadastrado para calcular o rodízio.</p>
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

  formatarDataCurta(data: any): string {
    const d = new Date(data);
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${dia}/${mes}`;
  }
}

