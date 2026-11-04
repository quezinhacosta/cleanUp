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
  // Lista padrão de moradores
  private readonly moradoresIniciais: Morador[] = [
    {
      id: 'm1',
      nome: 'Lucas Silva',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'
    },
    {
      id: 'm2',
      nome: 'Quezia Costa',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80'
    },
    {
      id: 'm3',
      nome: 'Matheus Oliveira',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80'
    },
    {
      id: 'm4',
      nome: 'Beatriz Santos',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80'
    }
  ];

  // Tarefas padrão do ciclo
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

  // Escala inicial de 4 semanas a partir de hoje
  private getEscalaInicial(): EscalaSemana[] {
    const hoje = new Date();
    // início da semana (segunda-feira recente ou atual)
    const diaSemana = hoje.getDay();
    const diffParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
    
    const baseSegunda = new Date(hoje);
    baseSegunda.setDate(hoje.getDate() + diffParaSegunda);
    baseSegunda.setHours(0, 0, 0, 0);

    const escala: EscalaSemana[] = [];
    const nomesOrdem = this.moradoresIniciais;

    for (let i = 0; i < 4; i++) {
      const dataInicio = new Date(baseSegunda);
      dataInicio.setDate(baseSegunda.getDate() + i * 7);

      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataInicio.getDate() + 6);
      dataFim.setHours(23, 59, 59, 999);

      escala.push({
        semanaId: `sem-${i + 1}`,
        dataInicio,
        dataFim,
        responsavel: nomesOrdem[i % nomesOrdem.length],
        status: i === 0 ? 'EM_ANDAMENTO' : 'PENDENTE'
      });
    }

    return escala;
  }

  // Histórico inicial com alguns registros demonstrativos
  private getHistoricoInicial(): RegistroLimpeza[] {
    const hoje = new Date();
    const ontem = new Date(hoje.getTime() - 24 * 60 * 60 * 1000);
    const anteontem = new Date(hoje.getTime() - 48 * 60 * 60 * 1000);

    return [
      {
        id: 'reg-1',
        moradorId: 'm1',
        moradorNome: 'Lucas Silva',
        tarefaNome: 'Desinfetar Pia e Fogão',
        dataHora: new Date(ontem.setHours(19, 42, 18))
      },
      {
        id: 'reg-2',
        moradorId: 'm1',
        moradorNome: 'Lucas Silva',
        tarefaNome: 'Esvaziar Lixeiras e Descartar Lixo Externo',
        dataHora: new Date(anteontem.setHours(21, 15, 4))
      }
    ];
  }

  // SIGNALS PRINCIPAIS DE ESTADO
  readonly moradores = signal<Morador[]>(this.carregarMoradores());
  readonly escala = signal<EscalaSemana[]>(this.carregarEscala());
  readonly tarefas = signal<Tarefa[]>(this.carregarTarefas());
  readonly historico = signal<RegistroLimpeza[]>(this.carregarHistorico());
  readonly moradorAtivo = signal<Morador>(this.carregarMoradorAtivo());

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
        localStorage.setItem(STORAGE_KEY_MORADOR_ATIVO, JSON.stringify(this.moradorAtivo()));
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

  // AÇÕES

  /**
   * Marca ou desmarca tarefa, gerando log de transparência imediato com data e hora precisa
   */
  alternarTarefa(tarefaId: string, moradorResponsavel?: Morador): void {
    const morador = moradorResponsavel || this.moradorAtivo();
    const tarefaAlvo = this.tarefas().find(t => t.id === tarefaId);
    if (!tarefaAlvo) return;

    const novoEstado = !tarefaAlvo.concluida;

    this.tarefas.update(lista =>
      lista.map(t => (t.id === tarefaId ? { ...t, concluida: novoEstado } : t))
    );

    if (novoEstado) {
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

    // Conclui a atual e avança a fila de rodízio
    const moradores = this.moradores();
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
    // Reinicia as tarefas para o novo ciclo
    this.tarefas.update(tList => tList.map(t => ({ ...t, concluida: false })));
  }

  limparHistorico(): void {
    this.historico.set([]);
  }

  setMoradorAtivo(morador: Morador): void {
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
      return data ? JSON.parse(data) : this.moradoresIniciais;
    } catch {
      return this.moradoresIniciais;
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
      if (!data) return this.getHistoricoInicial();
      const parsed = JSON.parse(data);
      return parsed.map((item: any) => ({
        ...item,
        dataHora: new Date(item.dataHora)
      }));
    } catch {
      return this.getHistoricoInicial();
    }
  }

  private carregarEscala(): EscalaSemana[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ESCALA);
      if (!data) return this.getEscalaInicial();
      const parsed = JSON.parse(data);
      return parsed.map((item: any) => ({
        ...item,
        dataInicio: new Date(item.dataInicio),
        dataFim: new Date(item.dataFim)
      }));
    } catch {
      return this.getEscalaInicial();
    }
  }

  private carregarMoradorAtivo(): Morador {
    try {
      const data = localStorage.getItem(STORAGE_KEY_MORADOR_ATIVO);
      if (data) return JSON.parse(data);
      return this.moradoresIniciais[0];
    } catch {
      return this.moradoresIniciais[0];
    }
  }
}
