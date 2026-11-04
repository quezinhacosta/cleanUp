import { TestBed } from '@angular/core/testing';
import { CleanupService } from './cleanup.service';
import { Morador, Tarefa } from '../models/cleanup.model';

describe('CleanupService', () => {
  let service: CleanupService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [CleanupService]
    });
    service = TestBed.inject(CleanupService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('deve inicializar com moradores, escala, tarefas e historico', () => {
    expect(service.moradores().length).toBeGreaterThan(0);
    expect(service.escala().length).toBe(4);
    expect(service.tarefas().length).toBeGreaterThan(0);
    expect(service.semanaAtual()).toBeTruthy();
    expect(service.progressoSemana()).toBeDefined();
  });

  it('deve alternar a conclusão de uma tarefa e gerar registro no feed com data/hora precisa', () => {
    const primeiraTarefa = service.tarefas()[0];
    const statusOriginal = primeiraTarefa.concluida;
    const historicoOriginalLen = service.historico().length;

    service.alternarTarefa(primeiraTarefa.id);

    const tarefaAtualizada = service.tarefas().find(t => t.id === primeiraTarefa.id);
    expect(tarefaAtualizada?.concluida).toBe(!statusOriginal);

    if (!statusOriginal) {
      // Se concluiu a tarefa, deve ter adicionado registro no histórico
      expect(service.historico().length).toBe(historicoOriginalLen + 1);
      const novoRegistro = service.historico()[0];
      expect(novoRegistro.tarefaNome).toBe(primeiraTarefa.titulo);
      expect(novoRegistro.moradorNome).toBe(service.moradorAtivo().nome);
      expect(novoRegistro.dataHora instanceof Date).toBe(true);
    }
  });

  it('deve calcular corretamente a porcentagem de progresso da semana', () => {
    // Zerar todas
    service.reiniciarCicloSemanal();
    expect(service.progressoSemana().porcentagem).toBe(0);
    expect(service.progressoSemana().concluidas).toBe(0);

    // Concluir 1 tarefa
    const t1 = service.tarefas()[0];
    service.alternarTarefa(t1.id);

    const progresso = service.progressoSemana();
    expect(progresso.concluidas).toBe(1);
    const expectedPerc = Math.round((1 / progresso.total) * 100);
    expect(progresso.porcentagem).toBe(expectedPerc);
  });

  it('deve filtrar histórico por morador e por busca de tarefa', () => {
    service.limparHistorico();

    const morador1: Morador = service.moradores()[0];
    const morador2: Morador = service.moradores()[1];

    service.setMoradorAtivo(morador1);
    service.alternarTarefa(service.tarefas()[0].id); // morador 1 concluiu tarefa 0

    service.setMoradorAtivo(morador2);
    service.alternarTarefa(service.tarefas()[1].id); // morador 2 concluiu tarefa 1

    expect(service.historico().length).toBe(2);

    // Filtro por morador1
    service.setFiltroMorador(morador1.id);
    expect(service.historicoFiltrado().length).toBe(1);
    expect(service.historicoFiltrado()[0].moradorId).toBe(morador1.id);

    // Limpar filtro de morador e filtrar por nome da tarefa 1
    service.setFiltroMorador('TODOS');
    service.setFiltroTarefa(service.tarefas()[1].titulo.substring(0, 5));
    expect(service.historicoFiltrado().length).toBe(1);
    expect(service.historicoFiltrado()[0].tarefaNome).toBe(service.tarefas()[1].titulo);
  });

  it('deve adicionar e remover nova tarefa no checklist', () => {
    const totalInicial = service.tarefas().length;
    service.adicionarTarefa('Limpar filtro do ar-condicionado', 'Quarto' as any);

    expect(service.tarefas().length).toBe(totalInicial + 1);
    const recemCriada = service.tarefas().find(t => t.titulo === 'Limpar filtro do ar-condicionado');
    expect(recemCriada).toBeTruthy();
    expect(recemCriada?.concluida).toBe(false);

    if (recemCriada) {
      service.removerTarefa(recemCriada.id);
      expect(service.tarefas().length).toBe(totalInicial);
    }
  });

  it('deve avançar o rodízio da escala para a próxima semana', () => {
    const escalaOriginal = service.escala();
    const responsavelSemanaAtual = escalaOriginal[0].responsavel;
    const responsavelProximaSemana = escalaOriginal[1].responsavel;

    service.avancarSemana();

    const novaEscala = service.escala();
    expect(novaEscala.length).toBe(4);
    expect(novaEscala[0].responsavel.id).toBe(responsavelProximaSemana.id);
    expect(novaEscala[0].status).toBe('EM_ANDAMENTO');
    // Todas as tarefas foram reiniciadas
    expect(service.progressoSemana().concluidas).toBe(0);
  });
});

