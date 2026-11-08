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
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 transition-all duration-200 hover:shadow-md">
      
      <!-- Cabeçalho do Feed -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div class="flex items-center space-x-2">
            <h3 class="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center">
              <span class="w-3 h-3 rounded-full bg-emerald-500 mr-2.5 shrink-0"></span>
              Feed / Histórico de Atividades
            </h3>
            <span class="text-xs sm:text-sm font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Log de Transparência
            </span>
          </div>
          <p class="text-sm sm:text-base text-slate-500 mt-1">
            Registro imutável de todas as tarefas concluídas com data e hora exata (HH:mm:ss)
          </p>
        </div>

        <!-- Ações do Cabeçalho: Baixar PDF -->
        <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          
          <!-- Botão Baixar Relatório PDF com Toggle de Clique -->
          <div class="relative flex-1 sm:flex-none">
            <button
              type="button"
              (click)="alternarMenuPdf()"
              class="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-sm border border-blue-200 shadow-2xs transition-colors cursor-pointer"
              title="Exportar relatórios em PDF"
            >
              <svg class="w-4 h-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Baixar Relatório (PDF)</span>
              <svg
                class="w-4 h-4 ml-2 text-blue-500 transition-transform duration-200"
                [class.rotate-180]="menuPdfAberto()"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Menu de Opções de Exportação PDF -->
            @if (menuPdfAberto()) {
              <div class="fixed inset-0 z-40" (click)="fecharMenuPdf()"></div>

              <div class="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-200 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div class="px-4 py-2 border-b border-slate-100">
                  <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Exportar Relatório PDF</p>
                  <p class="text-xs text-slate-500">Documento formatado para conferência de tarefas</p>
                </div>

                <div class="max-h-64 overflow-y-auto">
                  <!-- Opção Morador Atual ou Selecionado no Filtro -->
                  @if (getMoradorFiltroAtivo(); as moradorFiltro) {
                    <button
                      type="button"
                      (click)="baixarPdfMoradorECerrar(moradorFiltro)"
                      class="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left cursor-pointer"
                    >
                      <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <span class="truncate">Relatório de <strong>{{ moradorFiltro.nome }}</strong></span>
                    </button>
                  }

                  <!-- Lista de cada morador individualmente -->
                  @for (m of service.moradores(); track m.id) {
                    <button
                      type="button"
                      (click)="baixarPdfMoradorECerrar(m)"
                      class="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left cursor-pointer"
                    >
                      <img
                        [src]="m.avatarUrl || 'https://ui-avatars.com/api/?name=' + m.nome"
                        [alt]="m.nome"
                        class="w-6 h-6 rounded-full object-cover"
                      />
                      <span class="truncate font-medium">{{ m.nome }}</span>
                    </button>
                  }
                </div>

                <!-- Relatório Geral -->
                <div class="border-t border-slate-100 mt-1 pt-1.5 px-1">
                  <button
                    type="button"
                    (click)="baixarPdfGeralECerrar()"
                    class="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-sm font-bold text-blue-700 hover:bg-blue-50 transition-colors text-left cursor-pointer"
                  >
                    <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Relatório Geral do Apartamento</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Barra de Filtros (Morador + Busca Tarefa) -->
      <div class="mt-4 flex flex-col sm:flex-row gap-3">
        <!-- Busca de Tarefa -->
        <div class="relative flex-1">
          <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            [ngModel]="service.filtroTarefa()"
            (ngModelChange)="service.setFiltroTarefa($event)"
            placeholder="Buscar por tarefa..."
            class="w-full text-sm sm:text-base pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
          />
          @if (service.filtroTarefa()) {
            <button
              (click)="service.setFiltroTarefa('')"
              class="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-sm"
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
            class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer"
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
              class="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors flex items-center space-x-2 cursor-pointer"
              [class.bg-blue-600]="service.filtroMorador() === morador.id"
              [class.text-white]="service.filtroMorador() === morador.id"
              [class.bg-slate-100]="service.filtroMorador() !== morador.id"
              [class.text-slate-700]="service.filtroMorador() !== morador.id"
            >
              <img
                [src]="morador.avatarUrl || 'https://ui-avatars.com/api/?name=' + morador.nome"
                [alt]="morador.nome"
                class="w-5 h-5 rounded-full object-cover"
              />
              <span>{{ primeiroNome(morador.nome) }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Tabela com CSS Responsivo Seguro (Sem quebras de layout) -->
      <div class="mt-4 border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[620px] text-left text-sm divide-y divide-slate-100">
            <thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th class="py-3.5 px-4 w-[220px] text-xs font-bold uppercase tracking-wider text-slate-500">Morador</th>
                <th class="py-3.5 px-4 min-w-[240px] text-xs font-bold uppercase tracking-wider text-slate-500">Tarefa Realizada</th>
                <th class="py-3.5 px-4 w-[130px] text-xs font-bold uppercase tracking-wider text-slate-500">Data</th>
                <th class="py-3.5 px-4 w-[140px] text-right text-xs font-bold uppercase tracking-wider text-slate-500">Hora Precisa</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              @for (registro of service.historicoFiltrado(); track registro.id) {
                <tr class="hover:bg-slate-50/80 transition-colors">
                  
                  <!-- [Morador] -->
                  <td class="py-3.5 px-4 whitespace-nowrap">
                    <div class="flex items-center space-x-3">
                      <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200 flex-shrink-0">
                        {{ getIniciais(registro.moradorNome) }}
                      </div>
                      <span class="font-bold text-slate-900 truncate max-w-[160px] text-sm sm:text-base">{{ registro.moradorNome }}</span>
                    </div>
                  </td>

                  <!-- [Tarefa Realizada] -->
                  <td class="py-3.5 px-4">
                    <div class="flex items-center space-x-2.5">
                      <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                      <span class="font-semibold text-slate-800 break-words leading-relaxed text-sm sm:text-base">{{ registro.tarefaNome }}</span>
                    </div>
                  </td>

                  <!-- [Data] -->
                  <td class="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium text-sm">
                    {{ formatarData(registro.dataHora) }}
                  </td>

                  <!-- [Hora precisa (HH:mm:ss)] -->
                  <td class="py-3.5 px-4 whitespace-nowrap text-right">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-lg font-mono text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                      <svg class="w-3.5 h-3.5 mr-1.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ formatarHoraPrecisa(registro.dataHora) }}
                    </span>
                  </td>

                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="py-12 text-center text-slate-400">
                    <svg class="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-base font-semibold text-slate-600">Nenhum registro de limpeza encontrado.</p>
                    <p class="text-xs text-slate-400 mt-1">As tarefas concluídas pelos moradores aparecerão aqui com hora exata.</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Resumo do Rodapé do Feed -->
      <div class="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-slate-500">
        <span>Mostrando <strong>{{ service.historicoFiltrado().length }}</strong> registros auditados</span>
        <span class="flex items-center">
          <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
          Exportação em PDF pronta para impressão e auditoria &bull; Feito por Quezia Costa
        </span>
      </div>

    </div>
  `
})
export class HistoricoAtividadesComponent {
  service = inject(CleanupService);
  pdfService = inject(RelatorioPdfService);
  menuPdfAberto = signal(false);

  alternarMenuPdf(): void {
    this.menuPdfAberto.update(v => !v);
  }

  fecharMenuPdf(): void {
    this.menuPdfAberto.set(false);
  }

  getMoradorFiltroAtivo(): Morador | null {
    const filtro = this.service.filtroMorador();
    if (filtro === 'TODOS') {
      return this.service.moradorAtivo();
    }
    return this.service.moradores().find(m => m.id === filtro) || null;
  }

  baixarPdfMoradorECerrar(morador: Morador): void {
    this.fecharMenuPdf();
    this.pdfService.gerarRelatorioMorador(
      morador,
      this.service.historico(),
      this.service.tarefas()
    );
  }

  baixarPdfGeralECerrar(): void {
    this.fecharMenuPdf();
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
