import { TestBed } from '@angular/core/testing';
import { RelatorioPdfService } from './relatorio-pdf.service';
import { Morador, RegistroLimpeza, Tarefa } from '../models/cleanup.model';

describe('RelatorioPdfService', () => {
  let service: RelatorioPdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RelatorioPdfService]
    });
    service = TestBed.inject(RelatorioPdfService);
  });

  it('deve ser instanciado com sucesso', () => {
    expect(service).toBeTruthy();
  });

  it('deve gerar relatório individual em PDF de um morador retornando documento válido', () => {
    const moradorTeste: Morador = { id: 'm1', nome: 'Quezia Costa' };
    const tarefasTeste: Tarefa[] = [
      { id: 't1', titulo: 'Limpar Banheiro', comodo: 'Banheiro', concluida: true }
    ];
    const historicoTeste: RegistroLimpeza[] = [
      {
        id: 'reg-1',
        moradorId: 'm1',
        moradorNome: 'Quezia Costa',
        tarefaNome: 'Limpar Banheiro',
        dataHora: new Date()
      }
    ];

    const doc = service.gerarRelatorioMorador(moradorTeste, historicoTeste, tarefasTeste);
    expect(doc).toBeTruthy();
    expect((doc as any).internal.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('deve gerar relatório geral consolidado de todos os moradores em PDF retornando documento válido', () => {
    const moradores: Morador[] = [
      { id: 'm1', nome: 'Quezia Costa' },
      { id: 'm2', nome: 'Lucas Silva' }
    ];
    const tarefas: Tarefa[] = [];
    const historico: RegistroLimpeza[] = [];

    const doc = service.gerarRelatorioGeral(moradores, historico, tarefas);
    expect(doc).toBeTruthy();
    expect((doc as any).internal.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
