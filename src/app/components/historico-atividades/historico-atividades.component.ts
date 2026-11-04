import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CleanupService } from '../../services/cleanup.service';
import { RelatorioPdfService } from '../../services/relatorio-pdf.service';
import { Morador } from '../../models/cleanup.model';

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

        <!-- Ações do Cabeçalho: Baixar PDF & Limpar -->
        <div class="flex items-center space-x-2 self-start md:self-auto">
          
          <!-- Dropdown/Botão Baixar Relatório PDF -->
          <div class="relative group">
            <button
              type="button"
              (click)="baixarPdfAtivo()"
              class="inline-flex items-center px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs border border-blue-200 shadow-2xs transition-colors"
              title="Baixar relatório em PDF com carimbo e auditoria"
            >
              <svg class="w-4 h-4 mr-1.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Baixar Relatório (PDF)</span>
              <svg class="w-3.5 h-3.5 ml-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Menu de Opções de Exportação PDF -->
            <div class="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 hidden group-hover:block hover:block z-50">
              <div class="px-3 py-1.5 border-b border-slate-100">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exportar Relatório PDF</p>
              </div>

              <!-- Opção Morador Atual ou Selecionado -->
              @if (getMoradorFiltroAtivo(); as moradorFiltro) {
                <button
                  type="button"
                  (click)="baixarPdfMorador(moradorFiltro)"
                  class="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
                >
                  <span class="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span class="truncate">Relatório de <strong>{{ moradorFiltro.nome }}</strong></span>
                </button>
              }

              <!-- Lista de cada morador individualmente -->
              @for (m of service.moradores(); track m.id) {
                <button
                  type="button"
                  (click)="baixarPdfMorador(m)"
                  class="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
                >
                  <img
                    [src]="m.avatarUrl || 'https://ui-avatars.com/api/?name=' + m.nome"
                    [alt]="m.nome"
                    class="w-5 h-5 rounded-full object-cover"
                  />
                  <span class="truncate">{{ m.nome }}</span>
                </button>
              }

              <!-- Relatório Geral -->
              <div class="border-t border-slate-100 mt-1 pt-1">
                <button
                  type="button"
                  (click)="baixarPdfGeral()"
                  class="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors text-left"
                >
                  <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Relatório Geral do Apartamento</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Botão Limpar Logs -->
          @if (service.historico().length > 0) {
            <button
              type="button"
              (click)="service.limparHistorico()"
              class="text-[11px] text-slate-400 hover:text-rose-600 transition-colors px-2 py-1"
              title="Limpar histórico local"
            >
              Limpar
            </button>
          }
        </div>
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
          Exportação em PDF pronta para impressão e auditoria
        </span>
      </div>

    </div>
  `
})
export class HistoricoAtividadesComponent {
  service = inject(CleanupService);
  pdfService = inject(RelatorioPdfService);

  getMoradorFiltroAtivo(): Morador | null {
    const filtro = this.service.filtroMorador();
    if (filtro === 'TODOS') {
      return this.service.moradorAtivo();
    }
    return this.service.moradores().find(m => m.id === filtro) || null;
  }

  baixarPdfAtivo(): void {
    const morador = this.getMoradorFiltroAtivo();
    if (morador) {
      this.baixarPdfMorador(morador);
    } else {
      this.baixarPdfGeral();
    }
  }

  baixarPdfMorador(morador: Morador): void {
    this.pdfService.gerarRelatorioMorador(
      morador,
      this.service.historico(),
      this.service.tarefas()
    );
  }

  baixarPdfGeral(): void {
    this.pdfService.gerarRelatorioGeral(
      this.service.moradores(),
      this.service.historico(),
      this.service.tarefas()
    );
  }

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
