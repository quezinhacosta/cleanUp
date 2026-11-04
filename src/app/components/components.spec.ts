import { TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header/header.component';
import { DashboardResumoComponent } from './dashboard-resumo/dashboard-resumo.component';
import { ChecklistTarefasComponent } from './checklist-tarefas/checklist-tarefas.component';
import { HistoricoAtividadesComponent } from './historico-atividades/historico-atividades.component';
import { EscalaRodizioComponent } from './escala-rodizio/escala-rodizio.component';
import { GerenciarMembrosComponent } from './gerenciar-membros/gerenciar-membros.component';
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
        GerenciarMembrosComponent
      ],
      providers: [CleanupService]
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('HeaderComponent', () => {
    it('deve renderizar o logo CleanUp e botão de membros', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('CleanUp');
      expect(compiled.textContent).toContain('Membros');
    });

    it('deve exibir o morador atualmente ativo quando cadastrado', () => {
      const service = TestBed.inject(CleanupService);
      service.adicionarMorador('Quezia Costa');
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('Quezia Costa');
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
  });

  describe('ChecklistTarefasComponent', () => {
    it('deve listar tarefas e permitir filtrar por cômodo', () => {
      const fixture = TestBed.createComponent(ChecklistTarefasComponent);
      fixture.detectChanges();
      const service = TestBed.inject(CleanupService);
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('Checklist de Tarefas');
      expect(service.tarefas().length).toBeGreaterThan(0);

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
    it('deve exibir o log de transparência com formato HH:mm:ss', () => {
      const fixture = TestBed.createComponent(HistoricoAtividadesComponent);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('Feed / Histórico de Atividades');
      expect(compiled.textContent).toContain('Log de Transparência');

      const dataTeste = new Date(2026, 10, 3, 14, 25, 30);
      const horaStr = fixture.componentInstance.formatarHoraPrecisa(dataTeste);
      expect(horaStr).toBe('14:25:30');
    });
  });

  describe('EscalaRodizioComponent', () => {
    it('deve exibir aviso quando não há membros e rodízio após cadastrar', () => {
      const service = TestBed.inject(CleanupService);
      const fixture = TestBed.createComponent(EscalaRodizioComponent);
      fixture.detectChanges();
      let compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('Nenhum membro cadastrado');

      service.adicionarMorador('Quezia Costa');
      fixture.detectChanges();
      compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Semana Atual');
      expect(compiled.textContent).toContain('Quezia Costa');
    });
  });
});
