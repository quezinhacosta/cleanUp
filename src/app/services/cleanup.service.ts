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
  // Tarefas padrão iniciais
  private readonly tarefasIniciais: Tarefa[] = [
    { id: 't1', titulo: 'Limpar Banheiro Principal (Pia, Vaso e Box)', comodo: 'Banheiro', concluida: false },
    { id: 't2', titulo: 'Lavar e Guardar Louça Acumulada', comodo: 'Cozinha', concluida: false },
    { id: 't3', titulo: 'Desinfetar Pia e Fogão', comodo: 'Cozinha', concluida: false },
    { id: 't4', titulo: 'Passar Pano no Chão da Cozinha', comodo: 'Cozinha', concluida: false },
    { id: 't5', titulo: 'Varrer e Passar Pano na Sala de Estar', comodo: 'Sala', concluida: false },
    { id: 't6', titulo: 'Esvaziar Lixeiras e Descartar Lixo Externo', comodo: 'Área Comum', concluida: false },
    { id: 't7', titulo: 'Organizar Mesas e Sofá da Sala', comodo: 'Sala', concluida: false },
    { id: 't8', titulo: 'Limpar Vidros e Varrer Varanda', comodo: 'Varanda', concluida: false }
  ];

  // SIGNALS PRINCIPAIS DE ESTADO (Sem dados mocados - inicia vazio caso não haja no storage)
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
    return ['TODOS', 'Cozinha', 'Banheiro', 'Sala', 'Área Comum', 'Varanda'];
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

  // GERENCIAMENTO DE MEMBROS / MORADORES

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

    // Atualiza a escala de rodízio automaticamente
    this.escala.set(this.gerarEscalaParaMoradores(novosMoradores));

    return novo;
  }

  removerMorador(id: string): void {
    const novosMoradores = this.moradores().filter(m => m.id !== id);
    this.moradores.set(novosMoradores);

    // Se o morador removido era o ativo, seleciona outro ou null
    if (this.moradorAtivo()?.id === id) {
      this.moradorAtivo.set(novosMoradores.length > 0 ? novosMoradores[0] : null);
    }

    // Se não restou nenhum morador, esvazia a escala; caso contrário, recalcula
    if (novosMoradores.length === 0) {
      this.escala.set([]);
    } else {
      this.escala.set(this.gerarEscalaParaMoradores(novosMoradores));
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

      escala.push({
        semanaId: `sem-${i + 1}-${moradores[i % moradores.length].id}`,
        dataInicio,
        dataFim,
        responsavel: moradores[i % moradores.length],
        status: i === 0 ? 'EM_ANDAMENTO' : 'PENDENTE'
      });
    }

    return escala;
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
      // Registra a limpeza no feed com a hora exata
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
      items.map((item, idx) => (idx === 0 ? { ...item, status: 'PENDENTE' } : item))
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

    // Próximo morador na sequência
    const proxMoradorIndex = lista.length % moradores.length;
    const proxMorador = moradores[proxMoradorIndex];

    const novaSemana: EscalaSemana = {
      semanaId: `sem-${Date.now()}`,
      dataInicio: proximaDataInicio,
      dataFim: proximaDataFim,
      responsavel: proxMorador,
      status: 'PENDENTE'
    };

    // Remove a primeira e insere a nova semana no final
    const novaLista = [...lista.slice(1), novaSemana];
    if (novaLista.length > 0) {
      novaLista[0].status = 'EM_ANDAMENTO';
      this.setMoradorAtivo(novaLista[0].responsavel);
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
      return parsed.map((item: any) => ({
        ...item,
        dataInicio: new Date(item.dataInicio),
        dataFim: new Date(item.dataFim)
      }));
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
