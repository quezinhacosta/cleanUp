import { Injectable } from '@angular/core';
import { Morador, RegistroLimpeza, Tarefa } from '../models/cleanup.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class RelatorioPdfService {

  protected criarDocumento(): jsPDF {
    return new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
  }

  /**
   * Gera e faz o download imediato do relatório em PDF para um morador específico
   */
  gerarRelatorioMorador(morador: Morador, historico: RegistroLimpeza[], todasTarefas: Tarefa[]): jsPDF {
    if (!morador || !morador.id) {
      throw new Error('Morador inválido para emissão de relatório');
    }
    const doc = this.criarDocumento();

    const registrosDoMorador = historico
      .filter(h => h.moradorId === morador.id)
      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());

    const totalRealizadas = registrosDoMorador.length;
    const agora = new Date();
    const dataHoraEmissao = agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR');

    // CORES DO TEMA CLEANUP
    const primaryBlue = [37, 99, 235]; // #2563eb
    const darkSlate = [30, 41, 59];    // #1e293b
    const lightSlate = [100, 116, 139]; // #64748b
    const bgHeader = [241, 245, 249];  // #f1f5f9

    // CABEÇALHO DO DOCUMENTO
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(0, 0, 210, 8, 'F'); // Barra superior azul

    // Título Principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text('CleanUp', 14, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(lightSlate[0], lightSlate[1], lightSlate[2]);
    doc.text('Relatório Oficial de Auditoria e Escala de Limpeza', 14, 28);
    doc.text(`Apartamento Compartilhado | Emissão: ${dataHoraEmissao}`, 14, 33);

    // Linha divisória
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 37, 196, 37);

    // CARD DE INFORMAÇÕES DO MORADOR
    doc.setFillColor(bgHeader[0], bgHeader[1], bgHeader[2]);
    doc.roundedRect(14, 42, 182, 32, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(morador.nome, 20, 52);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(lightSlate[0], lightSlate[1], lightSlate[2]);
    doc.text(`ID do Morador: ${morador.id}`, 20, 58);
    doc.text(`Status: Integrante Ativo da Escala de Limpeza`, 20, 64);

    // Métricas em Destaque no Card
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.text(totalRealizadas.toString(), 165, 54, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(lightSlate[0], lightSlate[1], lightSlate[2]);
    doc.text('TAREFAS CONCLUÍDAS', 165, 60, { align: 'center' });

    // RESUMO POR CÔMODO
    const tarefasRealizadasPorComodo = new Map<string, number>();
    registrosDoMorador.forEach(reg => {
      const tarefaOrig = todasTarefas.find(t => t.titulo === reg.tarefaNome);
      const comodo = tarefaOrig ? tarefaOrig.comodo : 'Geral';
      tarefasRealizadasPorComodo.set(comodo, (tarefasRealizadasPorComodo.get(comodo) || 0) + 1);
    });

    let comodoResumoTexto = 'Divisão por setores: ';
    if (tarefasRealizadasPorComodo.size > 0) {
      const partes: string[] = [];
      tarefasRealizadasPorComodo.forEach((qtd, com) => partes.push(`${com}: ${qtd}`));
      comodoResumoTexto += partes.join(' | ');
    } else {
      comodoResumoTexto += 'Nenhum registro efetuado no período.';
    }

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(lightSlate[0], lightSlate[1], lightSlate[2]);
    doc.text(comodoResumoTexto, 14, 80);

    // TABELA DETALHADA COM DATA E HORA PRECISA (HH:mm:ss)
    const tabelaDados = registrosDoMorador.map((reg, index) => {
      const d = new Date(reg.dataHora);
      const dia = d.getDate().toString().padStart(2, '0');
      const mes = (d.getMonth() + 1).toString().padStart(2, '0');
      const ano = d.getFullYear();
      const horas = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      const segs = d.getSeconds().toString().padStart(2, '0');

      return [
        (index + 1).toString(),
        reg.tarefaNome,
        `${dia}/${mes}/${ano}`,
        `${horas}:${mins}:${segs}`,
        'Concluído'
      ];
    });

    if (tabelaDados.length === 0) {
      tabelaDados.push(['-', 'Nenhuma tarefa registrada para este morador até o momento.', '-', '-', '-']);
    }

    autoTable(doc, {
      startY: 85,
      head: [['#', 'Tarefa Realizada', 'Data', 'Hora Precisa', 'Auditoria']],
      body: tabelaDados,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 95 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 24, halign: 'center', textColor: [16, 185, 129] }
      },
      margin: { left: 14, right: 14 }
    });

    // RODAPÉ DO PDF
    const totalPaginas = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);

      // Linha separadora do rodapé
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 285, 196, 285);

      doc.text(
        'CleanUp • Sistema de Gestão e Escala de Limpeza Compartilhada • Desenvolvido por Quezia Costa',
        14,
        290
      );
      doc.text(`Página ${i} de ${totalPaginas}`, 196, 290, { align: 'right' });
    }

    // NOME DO ARQUIVO PARA DOWNLOAD
    const nomeLimpo = morador.nome.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const dataArquivo = agora.toISOString().split('T')[0];
    const nomeArquivo = `cleanup-relatorio-${nomeLimpo}-${dataArquivo}.pdf`;

    if (typeof (doc as any).save === 'function') {
      try {
        doc.save(nomeArquivo);
      } catch {
        // Ambiente de teste sem suporte a DOM save
      }
    }

    return doc;
  }

  /**
   * Gera relatório consolidado de todos os moradores do apartamento
   */
  gerarRelatorioGeral(moradores: Morador[], historico: RegistroLimpeza[], todasTarefas: Tarefa[]): jsPDF {
    const doc = this.criarDocumento();

    const agora = new Date();
    const dataHoraEmissao = agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR');

    // Barra superior azul
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 8, 'F');

    // Título Principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text('CleanUp', 14, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Relatório Geral Consolidado de Limpeza e Tarefas', 14, 28);
    doc.text(`Apartamento Compartilhado | Emissão: ${dataHoraEmissao}`, 14, 33);

    // Linha divisória
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 37, 196, 37);

    // Resumo de Desempenho por Integrante
    const resumoCorpo = moradores.map(m => {
      const concluidas = historico.filter(h => h.moradorId === m.id).length;
      return [m.nome, `${concluidas} tarefas registradas`, 'Membro Ativo'];
    });

    autoTable(doc, {
      startY: 43,
      head: [['Integrante', 'Desempenho Total', 'Status']],
      body: resumoCorpo.length > 0 ? resumoCorpo : [['Nenhum integrante cadastrado', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 9
      },
      bodyStyles: { fontSize: 8.5 },
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 80;

    // Histórico Cronológico Completo
    const todosDados = [...historico]
      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
      .map((reg, index) => {
        const d = new Date(reg.dataHora);
        const dataStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        const horaStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
        return [
          (index + 1).toString(),
          reg.moradorNome,
          reg.tarefaNome,
          dataStr,
          horaStr
        ];
      });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Histórico Completo de Auditoria em Tempo Real', 14, finalY + 10);

    autoTable(doc, {
      startY: finalY + 14,
      head: [['#', 'Morador', 'Tarefa Realizada', 'Data', 'Hora Precisa']],
      body: todosDados.length > 0 ? todosDados : [['-', 'Sem histórico registrado', '-', '-', '-']],
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontSize: 9
      },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 }
    });

    // Rodapé
    const totalPaginas = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 285, 196, 285);
      doc.text(
        'CleanUp • Sistema de Gestão e Escala de Limpeza Compartilhada • Desenvolvido por Quezia Costa',
        14,
        290
      );
      doc.text(`Página ${i} de ${totalPaginas}`, 196, 290, { align: 'right' });
    }

    const nomeArquivoGeral = `cleanup-relatorio-geral-${agora.toISOString().split('T')[0]}.pdf`;
    if (typeof (doc as any).save === 'function') {
      try {
        doc.save(nomeArquivoGeral);
      } catch {
        // Ambiente de teste sem suporte a DOM save
      }
    }

    return doc;
  }
}
