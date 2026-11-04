import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CleanupService } from '../../services/cleanup.service';

@Component({
  selector: 'app-historico-atividades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 transition-all duration-200 hover:shadow-md">
      
      <!-- Cabeçalho do Feed -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div class="flex items-center space-x-2">
            <h3 class="text-lg font-bold text-slate-900 tracking-tight flex items-center">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span>
              Feed / Histórico de Atividades
            </h3>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Log de Transparência
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            Registro imutável de todas as tarefas concluídas com data e hora exata (HH:mm:ss)
          </p>
        </div>

        <!-- Botão Limpar Logs (se houver) -->
        @if (service.historico().length > 0) {
          <button
            type="button"
            (click)="service.limparHistorico()"
            class="text-[11px] text-slate-400 hover:text-rose-600 transition-colors self-start md:self-auto"
            title="Limpar histórico local"
          >
            Limpar registros
          </button>
        }
      </div>

      <!-- Barra de Filtros (Morador + Busca Tarefa) -->
      <div class="mt-4 flex flex-col sm:flex-row gap-3">
        <!-- Busca de Tarefa -->
        <div class="relative flex-1">
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            [ngModel]="service.filtroTarefa()"
            (ngModelChange)="service.setFiltroTarefa($event)"
            placeholder="Filtrar por tarefa..."
            class="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
          />
          @if (service.filtroTarefa()) {
            <button
              (click)="service.setFiltroTarefa('')"
              class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          }
        </div>

        <!-- Filtro por Morador -->
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            (click)="service.setFiltroMorador('TODOS')"
            class="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
            [class.bg-slate-900]="service.filtroMorador() === 'TODOS'"
            [class.text-white]="service.filtroMorador() === 'TODOS'"
            [class.bg-slate-100]="service.filtroMorador() !== 'TODOS'"
            [class.text-slate-600]="service.filtroMorador() !== 'TODOS'"
          >
            Todos
          </button>

          @for (morador of service.moradores(); track morador.id) {
            <button
              type="button"
              (click)="service.setFiltroMorador(morador.id)"
              class="px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5"
              [class.bg-blue-600]="service.filtroMorador() === morador.id"
              [class.text-white]="service.filtroMorador() === morador.id"
              [class.bg-slate-100]="service.filtroMorador() !== morador.id"
              [class.text-slate-600]="service.filtroMorador() !== morador.id"
            >
              <img
                [src]="morador.avatarUrl || 'https://ui-avatars.com/api/?name=' + morador.nome"
                [alt]="morador.nome"
                class="w-4 h-4 rounded-full object-cover"
              />
              <span>{{ primeiroNome(morador.nome) }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Tabela / Feed Responsivo -->
      <div class="mt-4 overflow-hidden border border-slate-100 rounded-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th class="py-2.5 px-3 sm:px-4">Morador</th>
                <th class="py-2.5 px-3 sm:px-4">Tarefa Realizada</th>
                <th class="py-2.5 px-3 sm:px-4">Data</th>
                <th class="py-2.5 px-3 sm:px-4 text-right">Hora Precisa</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (registro of service.historicoFiltrado(); track registro.id) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  
                  <!-- [Morador] -->
                  <td class="py-3 px-3 sm:px-4 whitespace-nowrap">
                    <div class="flex items-center space-x-2.5">
                      <div class="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] border border-blue-200">
                        {{ getIniciais(registro.moradorNome) }}
                      </div>
                      <span class="font-semibold text-slate-800">{{ registro.moradorNome }}</span>
                    </div>
                  </td>

                  <!-- [Tarefa Realizada] -->
                  <td class="py-3 px-3 sm:px-4">
                    <div class="flex items-center space-x-2">
                      <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span class="font-medium text-slate-700">{{ registro.tarefaNome }}</span>
                    </div>
                  </td>

                  <!-- [Data] -->
                  <td class="py-3 px-3 sm:px-4 whitespace-nowrap text-slate-500">
                    {{ formatarData(registro.dataHora) }}
                  </td>

                  <!-- [Hora precisa (HH:mm:ss)] -->
                  <td class="py-3 px-3 sm:px-4 whitespace-nowrap text-right">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <svg class="w-3 h-3 mr-1 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ formatarHoraPrecisa(registro.dataHora) }}
                    </span>
                  </td>

                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="py-10 text-center text-slate-400">
                    <svg class="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Nenhum registro de limpeza encontrado para os filtros selecionados.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Resumo do Rodapé do Feed -->
      <div class="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span>Mostrando {{ service.historicoFiltrado().length }} registros auditados</span>
        <span class="flex items-center">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
          Sincronizado localmente
        </span>
      </div>

    </div>
  `
})
export class HistoricoAtividadesComponent {
  service = inject(CleanupService);

  primeiroNome(nome: string): string {
    return nome.split(' ')[0];
  }

  getIniciais(nome: string): string {
    const partes = nome.trim().split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  formatarData(data: Date): string {
    const d = new Date(data);
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  formatarHoraPrecisa(data: Date): string {
    const d = new Date(data);
    const horas = d.getHours().toString().padStart(2, '0');
    const minutos = d.getMinutes().toString().padStart(2, '0');
    const segundos = d.getSeconds().toString().padStart(2, '0');
    return `${horas}:${minutos}:${segundos}`;
  }
}

