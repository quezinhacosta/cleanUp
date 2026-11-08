import { TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header/header.component';
import { DashboardResumoComponent } from './dashboard-resumo/dashboard-resumo.component';
import { ChecklistTarefasComponent } from './checklist-tarefas/checklist-tarefas.component';
import { HistoricoAtividadesComponent } from './historico-atividades/historico-atividades.component';
import { EscalaRodizioComponent } from './escala-rodizio/escala-rodizio.component';
import { GerenciarMembrosComponent } from './gerenciar-membros/gerenciar-membros.component';
import { SeletorPerfilComponent } from './seletor-perfil/seletor-perfil.component';
import { ModalConfirmacaoComponent } from './modal-confirmacao/modal-confirmacao.component';
import { HistoricoAcoesComponent } from './historico-acoes/historico-acoes.component';
import { CleanupService } from '../services/cleanup.service';

describe('CleanUp Components Test Suite', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        DashboardResumoComponent,
        ChecklistTarefasComponent,
        HistoricoAtividadesComponent,
        EscalaRodizioComponent,
        GerenciarMembrosComponent,
        SeletorPerfilComponent,
        ModalConfirmacaoComponent,
        HistoricoAcoesComponent
      ],
      providers: [CleanupService]
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('HeaderComponent', () => {
    it('deve renderizar o logo CleanUp e menção a Quezia Costa', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('CleanUp');
      expect(compiled.textContent).toContain('Quezia Costa');
      expect(compiled.textContent).toContain('Membros');
    });

    it('deve alternar menu de perfis via clique', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      const service = TestBed.inject(CleanupService);
      service.adicionarMorador('Quezia Costa');
      service.adicionarMorador('Carlos Souza');
      fixture.detectChanges();

      const comp = fixture.componentInstance;
      expect(comp.menuPerfisAberto()).toBe(false);

      comp.alternarMenuPerfis();
      expect(comp.menuPerfisAberto()).toBe(true);

      comp.selecionarMorador(service.moradores()[1]);
      expect(service.moradorAtivo()?.nome).toBe('Carlos Souza');
      expect(comp.menuPerfisAberto()).toBe(false);
    });
  });

  describe('SeletorPerfilComponent', () => {
    it('deve listar perfis e permitir alternar morador ativo com 1 clique', () => {
      const service = TestBed.inject(CleanupService);
      const m1 = service.adicionarMorador('Quezia Costa');
      const m2 = service.adicionarMorador('Carlos Souza');

      const fixture = TestBed.createComponent(SeletorPerfilComponent);
      fixture.detectChanges();

      const comp = fixture.componentInstance;
      expect(service.moradorAtivo()?.id).toBe(m1.id);

      comp.selecionar(m2);
      fixture.detectChanges();

      expect(service.moradorAtivo()?.id).toBe(m2.id);
      expect(fixture.nativeElement.textContent).toContain('Carlos Souza');
    });
  });

  describe('DashboardResumoComponent', () => {
    it('deve exibir mensagem para cadastrar moradores quando lista estiver vazia', () => {
      const fixture = TestBed.createComponent(DashboardResumoComponent);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('Nenhum morador cadastrado');
    });

    it('deve renderizar o card do responsável da semana e progresso após adicionar morador', () => {
      const service = TestBed.inject(CleanupService);
      service.adicionarMorador('Quezia Costa');

      const fixture = TestBed.createComponent(DashboardResumoComponent);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('Quezia Costa');
      expect(compiled.textContent).toContain('Progresso das Tarefas');
      expect(compiled.textContent).toContain('%');
    });

    it('deve renderizar múltiplos moradores em destaque de plantão compartilhado', () => {
      const service = TestBed.inject(CleanupService);
      const m1 = service.adicionarMorador('Quezia Costa');
      const m2 = service.adicionarMorador('Lucas Silva');
      const sem1 = service.escala()[0];
      service.adicionarMoradorNaSemana(sem1.semanaId, m2.id);

      const fixture = TestBed.createComponent(DashboardResumoComponent);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('Plantão Compartilhado');
      expect(compiled.textContent).toContain('Quezia Costa & Lucas Silva');
    });

    it('deve exibir estado de semana sem morador escalado com segurança', () => {
      const service = TestBed.inject(CleanupService);
      service.adicionarMorador('Quezia Costa');
      const sem1 = service.escala()[0];
      service.limparMoradoresDaSemana(sem1.semanaId);

      const fixture = TestBed.createComponent(DashboardResumoComponent);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('Sem Morador Escalado');
      expect(compiled.textContent).toContain('Nenhum morador escalado');
    });
  });

  describe('ChecklistTarefasComponent', () => {
    it('deve listar tarefas base e permitir filtrar por cômodo', () => {
      const fixture = TestBed.createComponent(ChecklistTarefasComponent);
      fixture.detectChanges();
      const service = TestBed.inject(CleanupService);
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('Checklist de Tarefas');
      expect(service.tarefas().length).toBe(5);

      service.setFiltroComodo('Banheiro');
      fixture.detectChanges();
      const todasBanheiro = service.tarefasFiltradas().every(t => t.comodo === 'Banheiro');
      expect(todasBanheiro).toBe(true);
    });

    it('deve abrir modal para adicionar nova tarefa', () => {
      const fixture = TestBed.createComponent(ChecklistTarefasComponent);
      const comp = fixture.componentInstance;
      expect(comp.modalAberto()).toBe(false);

      comp.alternarModalAdicionar();
      expect(comp.modalAberto()).toBe(true);
    });
  });

  describe('GerenciarMembrosComponent', () => {
    it('deve abrir modal e permitir cadastrar novo membro', () => {
      const fixture = TestBed.createComponent(GerenciarMembrosComponent);
      const service = TestBed.inject(CleanupService);
      service.abrirModalMembros();
      fixture.detectChanges();

      const comp = fixture.componentInstance;
      comp.novoNome = 'Novo Morador';
      comp.adicionar();

      expect(service.moradores().length).toBe(1);
      expect(service.moradores()[0].nome).toBe('Novo Morador');
    });
  });

  describe('HistoricoAtividadesComponent', () => {
    it('deve exibir o log de transparência com formato HH:mm:ss e toggle de PDF', () => {
      const fixture = TestBed.createComponent(HistoricoAtividadesComponent);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('Feed / Histórico de Atividades');
      expect(compiled.textContent).toContain('Log de Transparência');

      const comp = fixture.componentInstance;
      expect(comp.menuPdfAberto()).toBe(false);
      comp.alternarMenuPdf();
      expect(comp.menuPdfAberto()).toBe(true);
      comp.fecharMenuPdf();
      expect(comp.menuPdfAberto()).toBe(false);

      const dataTeste = new Date(2026, 10, 3, 14, 25, 30);
      const horaStr = comp.formatarHoraPrecisa(dataTeste);
      expect(horaStr).toBe('14:25:30');
    });
  });

  describe('EscalaRodizioComponent', () => {
    it('deve exibir aviso quando não há membros e rodízio após cadastrar', () => {
      const service = TestBed.inject(CleanupService);
      const fixture = TestBed.createComponent(EscalaRodizioComponent);
      fixture.detectChanges();
      let compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('Nenhum ciclo de rodízio cadastrado');

      service.adicionarMorador('Quezia Costa');
      fixture.detectChanges();
      compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Semana 1');
      expect(compiled.textContent).toContain('Quezia Costa');
    });

    it('deve permitir arrastar morador e soltar na semana de destino', () => {
      const service = TestBed.inject(CleanupService);
      const m1 = service.adicionarMorador('Quezia Costa');
      const m2 = service.adicionarMorador('Carlos Souza');

      const fixture = TestBed.createComponent(EscalaRodizioComponent);
      fixture.detectChanges();
      const comp = fixture.componentInstance;

      const semanas = service.escala();
      const sem1 = semanas[0];
      const sem2 = semanas[1];

      // Inicia arrasto de Carlos para a semana 1
      const mockDragEvent = {
        preventDefault: () => {},
        dataTransfer: {
          effectAllowed: '',
          dropEffect: '',
          setData: () => {},
          getData: () => JSON.stringify({ moradorId: m2.id, origemSemanaId: sem2.semanaId })
        }
      } as any;

      comp.aoIniciarArrasto(mockDragEvent, m2.id, sem2.semanaId);
      expect(comp.arrastandoMorador()?.moradorId).toBe(m2.id);

      comp.aoArrastarSobre(mockDragEvent, sem1.semanaId);
      expect(comp.semanaHover()).toBe(sem1.semanaId);

      comp.aoSoltar(mockDragEvent, sem1.semanaId);

      // Carlos deve ter sido movido para a semana 1
      const sem1Atual = service.escala().find(s => s.semanaId === sem1.semanaId);
      expect(sem1Atual?.responsaveis.some(m => m.id === m2.id)).toBe(true);
      expect(comp.arrastandoMorador()).toBeNull();
      expect(comp.semanaHover()).toBeNull();
    });

    it('deve permitir escalar morador via menu dropdown e esvaziar semana', () => {
      const service = TestBed.inject(CleanupService);
      const m1 = service.adicionarMorador('Quezia Costa');
      const m2 = service.adicionarMorador('Carlos Souza');

      const fixture = TestBed.createComponent(EscalaRodizioComponent);
      fixture.detectChanges();
      const comp = fixture.componentInstance;

      const sem1 = service.escala()[0];

      // Alterna menu de escalar
      comp.alternarMenuEscalar(sem1.semanaId);
      expect(comp.menuEscalarAbertoPara()).toBe(sem1.semanaId);

      // Escala Carlos na semana 1
      comp.escalarMorador(sem1.semanaId, m2.id);
      expect(comp.menuEscalarAbertoPara()).toBeNull();

      const sem1Atual = service.escala().find(s => s.semanaId === sem1.semanaId);
      expect(sem1Atual?.responsaveis.length).toBe(2);

      // Esvazia semana
      comp.limparSemana(sem1.semanaId);
      const sem1Vazia = service.escala().find(s => s.semanaId === sem1.semanaId);
      expect(sem1Vazia?.responsaveis.length).toBe(0);

      // Remove morador da semana
      service.adicionarMoradorNaSemana(sem1.semanaId, m1.id);
      comp.removerMorador(sem1.semanaId, m1.id);
      expect(service.escala()[0].responsaveis.length).toBe(0);
    });

    it('deve conectar o calendário mensal, permitindo navegar entre meses e visualizar células dos dias', () => {
      const service = TestBed.inject(CleanupService);
      service.adicionarMorador('Quezia Costa');
      service.adicionarMorador('Carlos Souza');

      const fixture = TestBed.createComponent(EscalaRodizioComponent);
      fixture.detectChanges();
      const comp = fixture.componentInstance;

      expect(comp.isMesAtual()).toBe(true);
      const mesAtual = service.mesVisualizacao().mes;
      const anoAtual = service.mesVisualizacao().ano;

      // Avança para o próximo mês
      comp.avancarMes();
      expect(comp.isMesAtual()).toBe(false);
      expect(comp.semanasExibidas().length).toBe(2);

      // Volta para o mês atual
      comp.irParaMesAtual();
      expect(comp.isMesAtual()).toBe(true);
      expect(service.mesVisualizacao().mes).toBe(mesAtual);
      expect(service.mesVisualizacao().ano).toBe(anoAtual);

      // Valida células do mini-calendário mensal
      const celulas = comp.celulasCalendario();
      expect(celulas.length).toBeGreaterThanOrEqual(28);
      const celulaHoje = celulas.find(c => c.isHoje);
      expect(celulaHoje).toBeDefined();

      // Alterna exibição do calendário
      expect(comp.exibirCalendarioMensal()).toBe(true);
      comp.alternarVisualizacaoCalendario();
      expect(comp.exibirCalendarioMensal()).toBe(false);

      // Valida contagem de semanas do morador no mês
      const m1 = service.moradores()[0];
      const contagem = comp.contarSemanasDoMoradorNoMes(m1.id);
      expect(contagem).toMatch(/[0-9]+ sem/);
    });

    it('deve permitir arrastar morador diretamente para um dia específico e usar menu do dia', () => {
      const service = TestBed.inject(CleanupService);
      const m1 = service.adicionarMorador('Quezia Costa');
      const m2 = service.adicionarMorador('Carlos Souza');

      const fixture = TestBed.createComponent(EscalaRodizioComponent);
      fixture.detectChanges();
      const comp = fixture.componentInstance;

      const dataAlvo = '2026-11-20';

      // 1. Escala Carlos via menu rápido do dia
      comp.alternarMenuDia(dataAlvo);
      expect(comp.menuDiaAbertoPara()).toBe(dataAlvo);
      comp.escalarMoradorNoDia(dataAlvo, m2.id);
      expect(comp.menuDiaAbertoPara()).toBeNull();

      expect(service.obterMoradoresDoDia(dataAlvo).some(m => m.id === m2.id)).toBe(true);

      // 2. Arrastar Carlos do dia 20 para o dia 25
      const dataDestino = '2026-11-25';
      const mockDragEvent = {
        preventDefault: () => {},
        dataTransfer: {
          effectAllowed: '',
          dropEffect: '',
          setData: () => {},
          getData: () => JSON.stringify({ moradorId: m2.id, origemDataIso: dataAlvo })
        }
      } as any;

      comp.aoIniciarArrastoDia(mockDragEvent, m2.id, dataAlvo);
      expect(comp.arrastandoMorador()?.moradorId).toBe(m2.id);
      expect(comp.arrastandoMorador()?.origemDataIso).toBe(dataAlvo);

      comp.aoArrastarSobreDia(mockDragEvent, dataDestino);
      expect(comp.diaHover()).toBe(dataDestino);

      comp.aoSoltarNoDia(mockDragEvent, dataDestino);
      expect(service.obterMoradoresDoDia(dataDestino).some(m => m.id === m2.id)).toBe(true);
      expect(service.obterMoradoresDoDia(dataAlvo).some(m => m.id === m2.id)).toBe(false);

      // 3. Remove morador do dia
      comp.removerMoradorDoDia(dataDestino, m2.id);
      expect(service.obterMoradoresDoDia(dataDestino).some(m => m.id === m2.id)).toBe(false);
    });
  });

  describe('ModalConfirmacaoComponent', () => {
    it('deve exibir modal quando houver confirmacaoPendente e disparar callback ao confirmar', () => {
      const service = TestBed.inject(CleanupService);
      const fixture = TestBed.createComponent(ModalConfirmacaoComponent);
      fixture.detectChanges();

      // Inicialmente oculto
      expect(fixture.nativeElement.textContent).not.toContain('Tem certeza');

      let executou = false;
      service.solicitarConfirmacao({
        titulo: 'Excluir Item',
        mensagem: 'Tem certeza que deseja excluir este item?',
        tipo: 'excluir',
        textoBotaoConfirmar: 'Sim, excluir',
        acaoConfirmar: () => { executou = true; }
      });

      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Excluir Item');
      expect(compiled.textContent).toContain('Tem certeza que deseja excluir');

      // Clica em confirmar
      service.confirmarAcao();
      expect(executou).toBe(true);
      expect(service.confirmacaoPendente()).toBeNull();
    });

    it('deve fechar modal sem executar ação ao cancelar', () => {
      const service = TestBed.inject(CleanupService);
      const fixture = TestBed.createComponent(ModalConfirmacaoComponent);

      let executou = false;
      service.solicitarConfirmacao({
        titulo: 'Incluir Tarefa',
        mensagem: 'Tem certeza que deseja incluir?',
        tipo: 'incluir',
        acaoConfirmar: () => { executou = true; }
      });

      fixture.detectChanges();
      service.cancelarConfirmacao();
      fixture.detectChanges();

      expect(executou).toBe(false);
      expect(service.confirmacaoPendente()).toBeNull();
    });
  });

  describe('HistoricoAcoesComponent', () => {
    it('deve listar as ações do sistema e permitir filtrar por tipo', () => {
      const service = TestBed.inject(CleanupService);
      service.registrarAcaoSistema('INCLUSAO', 'Morador Maria inserido');
      service.registrarAcaoSistema('EXCLUSAO', 'Tarefa antiga excluída');

      const fixture = TestBed.createComponent(HistoricoAcoesComponent);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Morador Maria inserido');
      expect(compiled.textContent).toContain('Tarefa antiga excluída');

      const comp = fixture.componentInstance;
      comp.filtroTipo.set('INCLUSAO');
      fixture.detectChanges();

      expect(comp.acoesFiltradas().length).toBe(1);
      expect(comp.acoesFiltradas()[0].descricao).toBe('Morador Maria inserido');
    });
  });

  describe('Regra de Exclusão de Morador e Limpeza Total', () => {
    it('deve apagar todo o histórico de atividades e dias da escala quando morador for removido', () => {
      const service = TestBed.inject(CleanupService);
      const m1 = service.adicionarMorador('Ana Silva');
      const m2 = service.adicionarMorador('Bruno Dias');

      // Registra atividades de limpeza para Ana
      service.alternarTarefa(service.tarefas()[0].id, m1);
      expect(service.historico().some(h => h.moradorId === m1.id)).toBe(true);

      // Atribui Ana para um dia específico
      service.atribuirMoradorAoDia('2026-11-15', m1.id);
      expect(service.obterMoradoresDoDia('2026-11-15').some(m => m.id === m1.id)).toBe(true);

      // Remove Ana
      service.removerMorador(m1.id);

      // Verifica que nada de Ana restou no histórico de limpeza nem nos dias da escala
      expect(service.historico().some(h => h.moradorId === m1.id)).toBe(false);
      expect(service.obterMoradoresDoDia('2026-11-15').some(m => m.id === m1.id)).toBe(false);
      expect(service.moradores().some(m => m.id === m1.id)).toBe(false);
    });

    it('não deve exibir botão de Limpar no Histórico de Atividades', () => {
      const fixture = TestBed.createComponent(HistoricoAtividadesComponent);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = Array.from(compiled.querySelectorAll('button')).map(b => b.textContent?.trim());

      expect(buttons.some(txt => txt === 'Limpar' || txt === 'Limpar Histórico')).toBe(false);
    });
  });
});
