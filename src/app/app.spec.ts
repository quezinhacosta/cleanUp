import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('deve criar o componente principal CleanUp', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('deve renderizar a logo CleanUp no header', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('CleanUp');
  });

  it('deve conter as seções principais da aplicação', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-header')).toBeTruthy();
    expect(compiled.querySelector('app-seletor-perfil')).toBeTruthy();
    expect(compiled.querySelector('app-historico-acoes')).toBeTruthy();
    expect(compiled.querySelector('app-checklist-tarefas')).toBeTruthy();
    expect(compiled.querySelector('app-escala-rodizio')).toBeTruthy();
    expect(compiled.querySelector('app-historico-atividades')).toBeTruthy();
    expect(compiled.querySelector('app-dashboard-resumo')).toBeNull();
  });
});
