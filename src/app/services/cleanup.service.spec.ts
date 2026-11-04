import { TestBed } from '@angular/core/testing';
import { CleanupService } from './cleanup.service';
import { Morador } from '../models/cleanup.model';

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

  it('deve inicializar sem dados mocados quando storage estiver limpo', () => {
    expect(service.moradores().length).toBe(0);
    expect(service.escala().length).toBe(0);
    expect(service.historico().length).toBe(0);
    expect(service.moradorAtivo()).toBeNull();
    expect(service.tarefas().length).toBeGreaterThan(0);
  });

  it('deve permitir adicionar novos membros e gerar o rodízio da escala dinamicamente', () => {
    const m1 = service.adicionarMorador('Quezia Costa');
    expect(service.moradores().length).toBe(1);
    expect(service.moradorAtivo()?.nome).toBe('Quezia Costa');
    expect(service.escala().length).toBeGreaterThanOrEqual(4);
    expect(service.semanaAtual()?.responsavel.nome).toBe('Quezia Costa');

    const m2 = service.adicionarMorador('Carlos Souza');
    expect(service.moradores().length).toBe(2);
    // Escala deve alternar entre Quezia e Carlos
    expect(service.escala()[0].responsavel.nome).toBe('Quezia Costa');
    expect(service.escala()[1].responsavel.nome).toBe('Carlos Souza');
  });

  it('deve permitir remover membro e readequar a escala de rodízio', () => {
    const m1 = service.adicionarMorador('Membro 1');
    const m2 = service.adicionarMorador('Membro 2');
    expect(service.moradores().length).toBe(2);

    service.removerMorador(m1.id);
    expect(service.moradores().length).toBe(1);
    expect(service.moradorAtivo()?.id).toBe(m2.id);
    expect(service.semanaAtual()?.responsavel.id).toBe(m2.id);

    service.removerMorador(m2.id);
    expect(service.moradores().length).toBe(0);
    expect(service.moradorAtivo()).toBeNull();
    expect(service.escala().length).toBe(0);
  });

  it('deve alternar a conclusão de uma tarefa e gerar registro no feed com data/hora precisa', () => {
    service.adicionarMorador('Quezia Costa');
    const primeiraTarefa = service.tarefas()[0];
    const statusOriginal = primeiraTarefa.concluida;

    service.alternarTarefa(primeiraTarefa.id);

    const tarefaAtualizada = service.tarefas().find(t => t.id === primeiraTarefa.id);
    expect(tarefaAtualizada?.concluida).toBe(!statusOriginal);

    expect(service.historico().length).toBe(1);
    const novoRegistro = service.historico()[0];
    expect(novoRegistro.tarefaNome).toBe(primeiraTarefa.titulo);
    expect(novoRegistro.moradorNome).toBe('Quezia Costa');
    expect(novoRegistro.dataHora instanceof Date).toBe(true);
  });

  it('deve calcular corretamente a porcentagem de progresso da semana', () => {
    service.adicionarMorador('Quezia Costa');
    service.reiniciarCicloSemanal();
    expect(service.progressoSemana().porcentagem).toBe(0);
    expect(service.progressoSemana().concluidas).toBe(0);

    const t1 = service.tarefas()[0];
    service.alternarTarefa(t1.id);

    const progresso = service.progressoSemana();
    expect(progresso.concluidas).toBe(1);
    const expectedPerc = Math.round((1 / progresso.total) * 100);
    expect(progresso.porcentagem).toBe(expectedPerc);
  });

  it('deve filtrar histórico por morador e por busca de tarefa', () => {
    const morador1 = service.adicionarMorador('Quezia Costa');
    const morador2 = service.adicionarMorador('Lucas Silva');

    service.setMoradorAtivo(morador1);
    service.alternarTarefa(service.tarefas()[0].id);

    service.setMoradorAtivo(morador2);
    service.alternarTarefa(service.tarefas()[1].id);

    expect(service.historico().length).toBe(2);

    service.setFiltroMorador(morador1.id);
    expect(service.historicoFiltrado().length).toBe(1);
    expect(service.historicoFiltrado()[0].moradorId).toBe(morador1.id);

    service.setFiltroMorador('TODOS');
    service.setFiltroTarefa(service.tarefas()[1].titulo.substring(0, 5));
    expect(service.historicoFiltrado().length).toBe(1);
    expect(service.historicoFiltrado()[0].tarefaNome).toBe(service.tarefas()[1].titulo);
  });

  it('deve avançar o rodízio da escala para a próxima semana', () => {
    const m1 = service.adicionarMorador('Quezia Costa');
    const m2 = service.adicionarMorador('Carlos Souza');

    const escalaOriginal = service.escala();
    const responsavelProximaSemana = escalaOriginal[1].responsavel;

    service.avancarSemana();

    const novaEscala = service.escala();
    expect(novaEscala.length).toBeGreaterThanOrEqual(4);
    expect(novaEscala[0].responsavel.id).toBe(responsavelProximaSemana.id);
    expect(novaEscala[0].status).toBe('EM_ANDAMENTO');
    expect(service.progressoSemana().concluidas).toBe(0);
  });
});
