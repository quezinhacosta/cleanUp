import { TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header/header.component';
import { DashboardResumoComponent } from './dashboard-resumo/dashboard-resumo.component';
import { ChecklistTarefasComponent } from './checklist-tarefas/checklist-tarefas.component';
import { HistoricoAtividadesComponent } from './historico-atividades/historico-atividades.component';
import { EscalaRodizioComponent } from './escala-rodizio/escala-rodizio.component';
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
        EscalaRodizioComponent
      ],
      providers: [CleanupService]
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('HeaderComponent', () => {
    it('deve renderizar o logo CleanUp e badge de plantão', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('CleanUp');
      expect(compiled.textContent).toContain('Plantão Ativo');
    });

    it('deve exibir o morador atualmente ativo', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      const service = TestBed.inject(CleanupService);
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain(service.moradorAtivo().nome);
    });
  });

  describe('DashboardResumoComponent', () => {
    it('deve renderizar o card do responsável da semana e progresso', () => {
      const fixture = TestBed.createComponent(DashboardResumoComponent);
      fixture.detectChanges();
      const service = TestBed.inject(CleanupService);
      const compiled = fixture.nativeElement as HTMLElement;

      const semanaAtual = service.semanaAtual();
      expect(semanaAtual).toBeTruthy();
      expect(compiled.textContent).toContain(semanaAtual!.responsavel.nome);
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

      // Simular filtro Banheiro
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

  describe('HistoricoAtividadesComponent', () => {
    it('deve exibir o log de transparência com formato HH:mm:ss', () => {
      const fixture = TestBed.createComponent(HistoricoAtividadesComponent);
      fixture.detectChanges();
      const service = TestBed.inject(CleanupService);
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('Feed / Histórico de Atividades');
      expect(compiled.textContent).toContain('Log de Transparência');

      // Testa formatação de hora precisa
      const dataTeste = new Date(2026, 10, 3, 14, 25, 30);
      const horaStr = fixture.componentInstance.formatarHoraPrecisa(dataTeste);
      expect(horaStr).toBe('14:25:30');
    });
  });

  describe('EscalaRodizioComponent', () => {
    it('deve exibir a escala de rodízio das próximas semanas', () => {
      const fixture = TestBed.createComponent(EscalaRodizioComponent);
      fixture.detectChanges();
      const service = TestBed.inject(CleanupService);
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('Visão da Escala de Rodízio');
      expect(compiled.textContent).toContain('Semana Atual');
      expect(service.escala().length).toBe(4);
    });
  });
});

