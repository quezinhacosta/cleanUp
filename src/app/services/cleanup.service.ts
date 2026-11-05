import { Injectable, signal, computed, effect } from '@angular/core';
import { Morador, Tarefa, RegistroLimpeza, EscalaSemana } from '../models/cleanup.model';

const STORAGE_KEY_MORADORES = 'cleanup_moradores';
const STORAGE_KEY_TAREFAS = 'cleanup_tarefas';
const STORAGE_KEY_HISTORICO = 'cleanup_historico';
const STORAGE_KEY_ESCALA = 'cleanup_escala';
const STORAGE_KEY_MORADOR_ATIVO = 'cleanup_morador_ativo';

@Injectable({
  providedIn: 'root'
})
export class CleanupService {
  // Tarefas base exigidas: limpar sala, corredor, banheiro, cozinha, área de serviço
  private readonly tarefasIniciais: Tarefa[] = [
    { id: 't-sala', titulo: 'Limpar Sala', comodo: 'Sala', concluida: false },
    { id: 't-corredor', titulo: 'Limpar Corredor', comodo: 'Corredor', concluida: false },
    { id: 't-banheiro', titulo: 'Limpar Banheiro', comodo: 'Banheiro', concluida: false },
    { id: 't-cozinha', titulo: 'Limpar Cozinha', comodo: 'Cozinha', concluida: false },
    { id: 't-area-servico', titulo: 'Limpar Área de Serviço', comodo: 'Área de Serviço', concluida: false }
  ];

  // SIGNALS PRINCIPAIS DE ESTADO
  readonly moradores = signal<Morador[]>(this.carregarMoradores());
  readonly escala = signal<EscalaSemana[]>(this.carregarEscala());
  readonly tarefas = signal<Tarefa[]>(this.carregarTarefas());
  readonly historico = signal<RegistroLimpeza[]>(this.carregarHistorico());
  readonly moradorAtivo = signal<Morador | null>(this.carregarMoradorAtivo());

  // Controle de Modal de Gerenciamento de Membros
  readonly modalMembrosAberto = signal<boolean>(false);

  // SIGNALS DE FILTROS DO FEED
  readonly filtroMorador = signal<string>('TODOS');
  readonly filtroTarefa = signal<string>('');
  readonly filtroComodo = signal<string>('TODOS');

  // SIGNALS COMPUTADOS
  readonly semanaAtual = computed<EscalaSemana | null>(() => {
    const lista = this.escala();
    return lista.length > 0 ? lista[0] : null;
  });

  readonly proximasSemanas = computed<EscalaSemana[]>(() => {
    const lista = this.escala();
    return lista.slice(1);
  });

  readonly progressoSemana = computed(() => {
    const lista = this.tarefas();
    const total = lista.length;
    const concluidas = lista.filter(t => t.concluida).length;
    const porcentagem = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    return { total, concluidas, porcentagem };
  });

  readonly historicoFiltrado = computed<RegistroLimpeza[]>(() => {
    const todos = this.historico();
    const moradorFiltro = this.filtroMorador();
    const tarefaFiltro = this.filtroTarefa().toLowerCase().trim();

    return todos
      .filter(item => {
        const matchMorador = moradorFiltro === 'TODOS' || item.moradorId === moradorFiltro;
        const matchTarefa = !tarefaFiltro || item.tarefaNome.toLowerCase().includes(tarefaFiltro);
        return matchMorador && matchTarefa;
      })
      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  });

  readonly tarefasFiltradas = computed<Tarefa[]>(() => {
    const todas = this.tarefas();
    const comodo = this.filtroComodo();
    if (comodo === 'TODOS') return todas;
    return todas.filter(t => t.comodo === comodo);
  });

  readonly comodos = computed<string[]>(() => {
    return ['TODOS', 'Sala', 'Corredor', 'Banheiro', 'Cozinha', 'Área de Serviço', 'Área Comum', 'Varanda'];
  });

  constructor() {
    // Efeito para persistência automática no LocalStorage
    effect(() => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY_MORADORES, JSON.stringify(this.moradores()));
        localStorage.setItem(STORAGE_KEY_ESCALA, JSON.stringify(this.escala()));
        localStorage.setItem(STORAGE_KEY_TAREFAS, JSON.stringify(this.tarefas()));
        localStorage.setItem(STORAGE_KEY_HISTORICO, JSON.stringify(this.historico()));
        const ativo = this.moradorAtivo();
        if (ativo) {
          localStorage.setItem(STORAGE_KEY_MORADOR_ATIVO, JSON.stringify(ativo));
        } else {
          localStorage.removeItem(STORAGE_KEY_MORADOR_ATIVO);
        }
      }
    });

    // Se a primeira semana já tem tarefas 100%, sincroniza status para CONCLUIDO
    effect(() => {
      const progresso = this.progressoSemana();
      const semana = this.semanaAtual();
      if (semana) {
        let novoStatus: EscalaSemana['status'] = 'EM_ANDAMENTO';
        if (progresso.total > 0 && progresso.concluidas === progresso.total) {
          novoStatus = 'CONCLUIDO';
        }

        if (semana.status !== novoStatus) {
          this.escala.update(items =>
            items.map((item, idx) => (idx === 0 ? { ...item, status: novoStatus } : item))
          );
        }
      }
    });
  }

  // GERENCIAMENTO DE MEMBROS E RODÍZIO DINÂMICO

  abrirModalMembros(): void {
    this.modalMembrosAberto.set(true);
  }

  fecharModalMembros(): void {
    this.modalMembrosAberto.set(false);
  }

  adicionarMorador(nome: string, avatarUrl?: string): Morador {
    const limpo = nome.trim();
    if (!limpo) {
      throw new Error('Nome do morador não pode ser vazio');
    }

    const novo: Morador = {
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nome: limpo,
      avatarUrl: avatarUrl?.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(limpo)}&background=2563eb&color=fff&bold=true`
    };

    const novosMoradores = [...this.moradores(), novo];
    this.moradores.set(novosMoradores);

    // Se não havia morador ativo, define o recém-criado
    if (!this.moradorAtivo()) {
      this.moradorAtivo.set(novo);
    }

    // Atualiza a escala incluindo o novo morador no rodízio
    const escalaAtual = this.escala();
    if (escalaAtual.length === 0) {
      this.escala.set(this.gerarEscalaParaMoradores(novosMoradores));
    } else {
      const semanaAtual = escalaAtual[0];
      const escalaReorganizada = this.recomporEscalaComNovosMoradores(semanaAtual, novosMoradores);
      this.escala.set(escalaReorganizada);
    }

    return novo;
  }

  removerMorador(id: string): void {
    const novosMoradores = this.moradores().filter(m => m.id !== id);
    this.moradores.set(novosMoradores);

    // Remove das semanas da escala
    this.escala.update(semanas =>
      semanas.map(sem => {
        const novosResponsaveis = (sem.responsaveis || []).filter(m => m.id !== id);
        return {
          ...sem,
          responsaveis: novosResponsaveis,
          responsavel: novosResponsaveis.length > 0 ? novosResponsaveis[0] : null
        };
      })
    );

    if (novosMoradores.length === 0) {
      this.moradorAtivo.set(null);
      this.escala.set([]);
      return;
    }

    if (this.moradorAtivo()?.id === id) {
      this.moradorAtivo.set(novosMoradores[0]);
    }
  }

  gerarEscalaParaMoradores(moradores: Morador[]): EscalaSemana[] {
    if (moradores.length === 0) return [];

    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const diffParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
    
    const baseSegunda = new Date(hoje);
    baseSegunda.setDate(hoje.getDate() + diffParaSegunda);
    baseSegunda.setHours(0, 0, 0, 0);

    const escala: EscalaSemana[] = [];
    const totalSemanas = Math.max(4, moradores.length);

    for (let i = 0; i < totalSemanas; i++) {
      const dataInicio = new Date(baseSegunda);
      dataInicio.setDate(baseSegunda.getDate() + i * 7);

      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataInicio.getDate() + 6);
      dataFim.setHours(23, 59, 59, 999);

      const moradorResp = moradores[i % moradores.length];

      escala.push({
        semanaId: `sem-${i + 1}-${moradorResp.id}-${Date.now()}`,
        dataInicio,
        dataFim,
        responsaveis: [moradorResp],
        responsavel: moradorResp,
        status: i === 0 ? 'EM_ANDAMENTO' : 'PENDENTE'
      });
    }

    return escala;
  }

  private recomporEscalaComNovosMoradores(semanaAtual: EscalaSemana, moradores: Morador[]): EscalaSemana[] {
    if (moradores.length === 0) return [];

    const escala: EscalaSemana[] = [{ ...semanaAtual }];
    const totalSemanas = Math.max(4, moradores.length);

    const responsavelAtual = (semanaAtual.responsaveis && semanaAtual.responsaveis[0]) || semanaAtual.responsavel;
    const idxAtual = responsavelAtual ? moradores.findIndex(m => m.id === responsavelAtual.id) : -1;
    const inicioProx = idxAtual >= 0 ? (idxAtual + 1) : 0;

    let baseFim = new Date(semanaAtual.dataFim);

    for (let i = 1; i < totalSemanas; i++) {
      const proximaDataInicio = new Date(baseFim);
      proximaDataInicio.setDate(proximaDataInicio.getDate() + 1);
      proximaDataInicio.setHours(0, 0, 0, 0);

      const proximaDataFim = new Date(proximaDataInicio);
      proximaDataFim.setDate(proximaDataInicio.getDate() + 6);
      proximaDataFim.setHours(23, 59, 59, 999);

      const responsavel = moradores[(inicioProx + (i - 1)) % moradores.length];

      escala.push({
        semanaId: `sem-${i + 1}-${responsavel.id}-${Date.now() + i}`,
        dataInicio: proximaDataInicio,
        dataFim: proximaDataFim,
        responsaveis: [responsavel],
        responsavel,
        status: 'PENDENTE'
      });

      baseFim = proximaDataFim;
    }

    return escala;
  }

  // MÉTODOS DE ARRASTAR / ORGANIZAR MORADORES ENTRE SEMANAS

  /**
   * Adiciona um morador em uma semana (permite mais de um morador na mesma semana)
   */
  adicionarMoradorNaSemana(semanaId: string, moradorId: string): void {
    const morador = this.moradores().find(m => m.id === moradorId);
    if (!morador) return;

    this.escala.update(semanas =>
      semanas.map(sem => {
        if (sem.semanaId !== semanaId) return sem;
        const jaEsta = (sem.responsaveis || []).some(m => m.id === moradorId);
        if (jaEsta) return sem;
        const novos = [...(sem.responsaveis || []), morador];
        return {
          ...sem,
          responsaveis: novos,
          responsavel: novos[0] || null
        };
      })
    );
  }

  /**
   * Remove um morador de uma semana (a semana pode ficar com 0 moradores)
   */
  removerMoradorDaSemana(semanaId: string, moradorId: string): void {
    this.escala.update(semanas =>
      semanas.map(sem => {
        if (sem.semanaId !== semanaId) return sem;
        const novos = (sem.responsaveis || []).filter(m => m.id !== moradorId);
        return {
          ...sem,
          responsaveis: novos,
          responsavel: novos.length > 0 ? novos[0] : null
        };
      })
    );
  }

  /**
   * Move ou adiciona morador entre semanas via Drag-and-Drop
   */
  moverMoradorEntreSemanas(moradorId: string, origemSemanaId: string | null, destinoSemanaId: string): void {
    const morador = this.moradores().find(m => m.id === moradorId);
    if (!morador) return;

    this.escala.update(semanas =>
      semanas.map(sem => {
        // Se foi arrastado de outra semana específica, remove da origem
        if (origemSemanaId && sem.semanaId === origemSemanaId && origemSemanaId !== destinoSemanaId) {
          const novosOrigem = (sem.responsaveis || []).filter(m => m.id !== moradorId);
          return {
            ...sem,
            responsaveis: novosOrigem,
            responsavel: novosOrigem.length > 0 ? novosOrigem[0] : null
          };
        }

        // Adiciona na semana de destino
        if (sem.semanaId === destinoSemanaId) {
          const jaTem = (sem.responsaveis || []).some(m => m.id === moradorId);
          const novosDestino = jaTem ? sem.responsaveis : [...(sem.responsaveis || []), morador];
          return {
            ...sem,
            responsaveis: novosDestino,
            responsavel: novosDestino.length > 0 ? novosDestino[0] : null
          };
        }

        return sem;
      })
    );
  }

  // AÇÕES DO CHECKLIST E CICLO

  alternarTarefa(tarefaId: string, moradorResponsavel?: Morador): void {
    const morador = moradorResponsavel || this.moradorAtivo();
    const tarefaAlvo = this.tarefas().find(t => t.id === tarefaId);
    if (!tarefaAlvo) return;

    const novoEstado = !tarefaAlvo.concluida;

    this.tarefas.update(lista =>
      lista.map(t => (t.id === tarefaId ? { ...t, concluida: novoEstado } : t))
    );

    if (novoEstado && morador) {
      const novoRegistro: RegistroLimpeza = {
        id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        moradorId: morador.id,
        moradorNome: morador.nome,
        tarefaNome: tarefaAlvo.titulo,
        dataHora: new Date()
      };

      this.historico.update(logs => [novoRegistro, ...logs]);
    }
  }

  adicionarTarefa(titulo: string, comodo: Tarefa['comodo']): void {
    if (!titulo.trim()) return;

    const nova: Tarefa = {
      id: `t-${Date.now()}`,
      titulo: titulo.trim(),
      comodo,
      concluida: false
    };

    this.tarefas.update(lista => [...lista, nova]);
  }

  removerTarefa(tarefaId: string): void {
    this.tarefas.update(lista => lista.filter(t => t.id !== tarefaId));
  }

  reiniciarCicloSemanal(): void {
    this.tarefas.update(lista => lista.map(t => ({ ...t, concluida: false })));
    this.escala.update(items =>
      items.map((item, idx) => (idx === 0 ? { ...item, status: 'EM_ANDAMENTO' } : item))
    );
  }

  avancarSemana(): void {
    const lista = this.escala();
    if (lista.length === 0) return;

    const moradores = this.moradores();
    if (moradores.length === 0) return;

    const ultimaSemana = lista[lista.length - 1];
    const proximaDataInicio = new Date(ultimaSemana.dataFim);
    proximaDataInicio.setDate(proximaDataInicio.getDate() + 1);
    proximaDataInicio.setHours(0, 0, 0, 0);

    const proximaDataFim = new Date(proximaDataInicio);
    proximaDataFim.setDate(proximaDataInicio.getDate() + 6);
    proximaDataFim.setHours(23, 59, 59, 999);

    const ultimoMorador = (ultimaSemana.responsaveis && ultimaSemana.responsaveis[0]) || ultimaSemana.responsavel;
    const ultimoMoradorIndex = ultimoMorador ? moradores.findIndex(m => m.id === ultimoMorador.id) : -1;
    const proxMoradorIndex = ultimoMoradorIndex >= 0 ? (ultimoMoradorIndex + 1) % moradores.length : 0;
    const proxMorador = moradores[proxMoradorIndex];

    const novaSemana: EscalaSemana = {
      semanaId: `sem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dataInicio: proximaDataInicio,
      dataFim: proximaDataFim,
      responsaveis: proxMorador ? [proxMorador] : [],
      responsavel: proxMorador || null,
      status: 'PENDENTE'
    };

    const novaLista = [...lista.slice(1), novaSemana];
    if (novaLista.length > 0) {
      novaLista[0] = { ...novaLista[0], status: 'EM_ANDAMENTO' };
      if (novaLista[0].responsaveis && novaLista[0].responsaveis.length > 0) {
        this.setMoradorAtivo(novaLista[0].responsaveis[0]);
      }
    }

    this.escala.set(novaLista);
    this.tarefas.update(tList => tList.map(t => ({ ...t, concluida: false })));
  }

  limparHistorico(): void {
    this.historico.set([]);
  }

  setMoradorAtivo(morador: Morador | null): void {
    this.moradorAtivo.set(morador);
  }

  setFiltroMorador(id: string): void {
    this.filtroMorador.set(id);
  }

  setFiltroTarefa(query: string): void {
    this.filtroTarefa.set(query);
  }

  setFiltroComodo(comodo: string): void {
    this.filtroComodo.set(comodo);
  }

  // MÉTODOS DE CARREGAMENTO LOCAL / HYDRATION

  private carregarMoradores(): Morador[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_MORADORES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private carregarTarefas(): Tarefa[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TAREFAS);
      return data ? JSON.parse(data) : this.tarefasIniciais;
    } catch {
      return this.tarefasIniciais;
    }
  }

  private carregarHistorico(): RegistroLimpeza[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_HISTORICO);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return parsed.map((item: any) => ({
        ...item,
        dataHora: new Date(item.dataHora)
      }));
    } catch {
      return [];
    }
  }

  private carregarEscala(): EscalaSemana[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ESCALA);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return parsed.map((item: any) => {
        const responsaveis: Morador[] = item.responsaveis
          ? item.responsaveis
          : (item.responsavel ? [item.responsavel] : []);
        return {
          ...item,
          dataInicio: new Date(item.dataInicio),
          dataFim: new Date(item.dataFim),
          responsaveis,
          responsavel: responsaveis.length > 0 ? responsaveis[0] : null
        };
      });
    } catch {
      return [];
    }
  }

  private carregarMoradorAtivo(): Morador | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_MORADOR_ATIVO);
      if (data) return JSON.parse(data);
      const moradores = this.carregarMoradores();
      return moradores.length > 0 ? moradores[0] : null;
    } catch {
      return null;
    }
  }
}
