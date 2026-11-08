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

  it('deve inicializar sem moradores mocados e com checklist base de 5 tarefas principais', () => {
    expect(service.moradores().length).toBe(0);
    expect(service.escala().length).toBe(0);
    expect(service.historico().length).toBe(0);
    expect(service.moradorAtivo()).toBeNull();

    // Tarefas base exigidas
    const titulos = service.tarefas().map(t => t.titulo);
    expect(titulos).toContain('Limpar Sala');
    expect(titulos).toContain('Limpar Corredor');
    expect(titulos).toContain('Limpar Banheiro');
    expect(titulos).toContain('Limpar Cozinha');
    expect(titulos).toContain('Limpar Área de Serviço');
  });

  it('deve permitir adicionar novos membros e não preencher as semanas automaticamente', () => {
    const m1 = service.adicionarMorador('Quezia Costa');
    expect(service.moradores().length).toBe(1);
    expect(service.moradorAtivo()?.nome).toBe('Quezia Costa');
    expect(service.escala().length).toBe(1);
    expect(service.semanaAtual()?.responsaveis.length).toBe(0);

    const m2 = service.adicionarMorador('Carlos Souza');
    expect(service.moradores().length).toBe(2);
    expect(service.escala().length).toBe(2);
    // As semanas não devem ser preenchidas automaticamente
    expect(service.escala()[0].responsaveis.length).toBe(0);
    expect(service.escala()[1].responsaveis.length).toBe(0);
  });

  it('deve alternar o rodízio entre múltiplos moradores escalados ao avançar', () => {
    const m1 = service.adicionarMorador('Quezia Costa');
    const m2 = service.adicionarMorador('Carlos Souza');
    const m3 = service.adicionarMorador('Ana Lima');

    service.adicionarMoradorNaSemana(service.escala()[0].semanaId, m1.id);
    service.adicionarMoradorNaSemana(service.escala()[1].semanaId, m2.id);
    service.adicionarMoradorNaSemana(service.escala()[2].semanaId, m3.id);

    expect(service.semanaAtual()?.responsaveis[0]?.nome).toBe('Quezia Costa');

    // Avanço 1 -> deve passar para Carlos
    service.avancarSemana();
    expect(service.semanaAtual()?.responsaveis[0]?.nome).toBe('Carlos Souza');
    expect(service.moradorAtivo()?.nome).toBe('Carlos Souza');

    // Avanço 2 -> deve passar para Ana
    service.avancarSemana();
    expect(service.semanaAtual()?.responsaveis[0]?.nome).toBe('Ana Lima');
    expect(service.moradorAtivo()?.nome).toBe('Ana Lima');

    // Avanço 3 -> deve voltar para Quezia
    service.avancarSemana();
    expect(service.semanaAtual()?.responsaveis[0]?.nome).toBe('Quezia Costa');
    expect(service.moradorAtivo()?.nome).toBe('Quezia Costa');
  });

  it('deve permitir remover membro e readequar a escala de rodízio', () => {
    const m1 = service.adicionarMorador('Membro 1');
    const m2 = service.adicionarMorador('Membro 2');
    expect(service.moradores().length).toBe(2);

    service.adicionarMoradorNaSemana(service.escala()[0].semanaId, m1.id);
    service.adicionarMoradorNaSemana(service.escala()[1].semanaId, m2.id);

    service.removerMorador(m1.id);
    expect(service.moradores().length).toBe(1);
    expect(service.moradorAtivo()?.id).toBe(m2.id);

    service.removerMorador(m2.id);
    expect(service.moradores().length).toBe(0);
    expect(service.moradorAtivo()).toBeNull();
    expect(service.escala().length).toBe(0);
  });

  it('deve permitir arrastar, mover e adicionar múltiplos moradores na mesma semana ou deixar semana vazia', () => {
    const m1 = service.adicionarMorador('Quezia Costa');
    const m2 = service.adicionarMorador('Carlos Souza');
    const m3 = service.adicionarMorador('Ana Lima');

    const escalaInicial = service.escala();
    const sem1 = escalaInicial[0];
    const sem2 = escalaInicial[1];

    service.adicionarMoradorNaSemana(sem1.semanaId, m1.id);
    service.adicionarMoradorNaSemana(sem1.semanaId, m2.id);
    const sem1Atualizada = service.escala().find(s => s.semanaId === sem1.semanaId);
    expect(sem1Atualizada?.responsaveis.length).toBe(2);
    expect(sem1Atualizada?.responsaveis.map(m => m.nome)).toEqual(['Quezia Costa', 'Carlos Souza']);

    // Mover Ana da semana 3 para semana 1
    const sem3 = escalaInicial[2];
    service.moverMoradorEntreSemanas(m3.id, sem3.semanaId, sem1.semanaId);
    const sem1AposMover = service.escala().find(s => s.semanaId === sem1.semanaId);
    const sem3AposMover = service.escala().find(s => s.semanaId === sem3.semanaId);
    expect(sem1AposMover?.responsaveis.some(m => m.id === m3.id)).toBe(true);
    expect(sem3AposMover?.responsaveis.some(m => m.id === m3.id)).toBe(false);

    // Esvaziar semana 2 (a semana pode ficar sem morador)
    service.limparMoradoresDaSemana(sem2.semanaId);
    const sem2Vazia = service.escala().find(s => s.semanaId === sem2.semanaId);
    expect(sem2Vazia?.responsaveis.length).toBe(0);
    expect(sem2Vazia?.responsavel).toBeNull();

    // Remover morador específico de semana
    service.removerMoradorDaSemana(sem1.semanaId, m2.id);
    const sem1SemCarlos = service.escala().find(s => s.semanaId === sem1.semanaId);
    expect(sem1SemCarlos?.responsaveis.some(m => m.id === m2.id)).toBe(false);

    // Adicionar nova semana à escala
    const qtdAntes = service.escala().length;
    service.adicionarSemanaNaEscala();
    expect(service.escala().length).toBe(qtdAntes + 1);
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
    service.setFiltroTarefa('Corredor');
    expect(service.historicoFiltrado().length).toBe(1);
    expect(service.historicoFiltrado()[0].tarefaNome).toBe(service.tarefas()[1].titulo);
  });

  it('deve gerenciar escala por dia específico: atribuir, mover e remover moradores de dias', () => {
    const m1 = service.adicionarMorador('Quezia Costa');
    const m2 = service.adicionarMorador('Carlos Souza');

    const dia1 = '2026-11-10';
    const dia2 = '2026-11-15';

    // Atribui Carlos especificamente ao dia 10
    service.atribuirMoradorAoDia(dia1, m2.id);
    let moradoresDia1 = service.obterMoradoresDoDia(dia1);
    expect(moradoresDia1.some(m => m.id === m2.id)).toBe(true);

    // Move Carlos do dia 10 para o dia 15
    service.moverMoradorEntreDias(m2.id, dia1, dia2);
    moradoresDia1 = service.obterMoradoresDoDia(dia1);
    const moradoresDia2 = service.obterMoradoresDoDia(dia2);
    expect(moradoresDia1.some(m => m.id === m2.id)).toBe(false);
    expect(moradoresDia2.some(m => m.id === m2.id)).toBe(true);

    // Remove do dia 15
    service.removerMoradorDoDia(dia2, m2.id);
    expect(service.obterMoradoresDoDia(dia2).some(m => m.id === m2.id)).toBe(false);

    // Limpar dia
    service.atribuirMoradorAoDia(dia1, m1.id);
    service.limparDia(dia1);
    expect(service.obterMoradoresDoDia(dia1).length).toBe(0);
  });

  it('deve mudar de mês corretamente na virada e transitar limites de ano (Dezembro <-> Janeiro)', () => {
    // Define mês em Dezembro de 2026
    service.mudarMesVisualizacao(2026, 11);
    expect(service.mesVisualizacao()).toEqual({ ano: 2026, mes: 11 });

    // Avança mês -> deve ir para Janeiro de 2027
    service.avancarMes();
    expect(service.mesVisualizacao()).toEqual({ ano: 2027, mes: 0 });

    // Volta mês -> deve retornar para Dezembro de 2026
    service.voltarMes();
    expect(service.mesVisualizacao()).toEqual({ ano: 2026, mes: 11 });

    // Volta mais um mês -> deve ir para Novembro de 2026
    service.voltarMes();
    expect(service.mesVisualizacao()).toEqual({ ano: 2026, mes: 10 });
  });
});
