import { TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header/header.component';
import { DashboardResumoComponent } from './dashboard-resumo/dashboard-resumo.component';
import { ChecklistTarefasComponent } from './checklist-tarefas/checklist-tarefas.component';
import { HistoricoAtividadesComponent } from './historico-atividades/historico-atividades.component';
import { EscalaRodizioComponent } from './escala-rodizio/escala-rodizio.component';
import { GerenciarMembrosComponent } from './gerenciar-membros/gerenciar-membros.component';
import { SeletorPerfilComponent } from './seletor-perfil/seletor-perfil.component';
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
        SeletorPerfilComponent
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
  });
});
