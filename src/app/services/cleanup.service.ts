import { Injectable, signal, computed, effect } from '@angular/core';
import { Morador, Tarefa, RegistroLimpeza, EscalaSemana, AcaoSistema, PedidoConfirmacao, ToastNotificacao } from '../models/cleanup.model';
import { supabase } from '../supabaseclient';

const STORAGE_KEY_MORADORES = 'cleanup_moradores';
const STORAGE_KEY_TAREFAS = 'cleanup_tarefas';
const STORAGE_KEY_HISTORICO = 'cleanup_historico';
const STORAGE_KEY_ESCALA = 'cleanup_escala';
const STORAGE_KEY_MORADOR_ATIVO = 'cleanup_morador_ativo';
const STORAGE_KEY_ESCALA_DIAS = 'cleanup_escala_dias';
const STORAGE_KEY_HISTORICO_ACOES = 'cleanup_historico_acoes';

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

  // SIGNALS PRINCIPAIS DE ESTADO (Com cache local imediato)
  readonly moradores = signal<Morador[]>(this.carregarMoradores());
  readonly escala = signal<EscalaSemana[]>(this.carregarEscala());
  readonly tarefas = signal<Tarefa[]>(this.carregarTarefas());
  readonly historico = signal<RegistroLimpeza[]>(this.carregarHistorico());
  readonly moradorAtivo = signal<Morador | null>(this.carregarMoradorAtivo());

  // Histórico de Ações Administrativas e de Sistema (separado do histórico de limpeza)
  readonly historicoAcoes = signal<AcaoSistema[]>(this.carregarHistoricoAcoes());

  // Controle de Notificações de Confirmação (Modal de confirmação antes de ações)
  readonly confirmacaoPendente = signal<PedidoConfirmacao | null>(null);

  // Sistema de Toasts Visuais para Feedback Imediato
  readonly toasts = signal<ToastNotificacao[]>([]);

  // Mapa de atribuições específicas por dia (YYYY-MM-DD -> id dos moradores)
  readonly escalaDias = signal<Record<string, string[]>>(this.carregarEscalaDias());

  // Data atual reativa para detecção automática da virada de dia/mês
  readonly dataHoje = signal<Date>(new Date());

  // Indicador de status de sincronização com o Supabase
  readonly sincronizandoComNuvem = signal<boolean>(false);

  // Mês selecionado para navegação e visualização da escala de rodízio
  readonly mesVisualizacao = signal<{ ano: number; mes: number }>({
    ano: new Date().getFullYear(),
    mes: new Date().getMonth()
  });

  // Controle de Modal de Gerenciamento de Membros
  readonly modalMembrosAberto = signal<boolean>(false);

  // SIGNALS DE FILTROS DO FEED
  readonly filtroMorador = signal<string>('TODOS');
  readonly filtroTarefa = signal<string>('');
  readonly filtroComodo = signal<string>('TODOS');

  // Canal Realtime do Supabase
  private canalRealtime: any = null;

  // SIGNALS COMPUTADOS
  readonly semanaAtual = computed<EscalaSemana | null>(() => {
    const lista = this.escala();
    if (lista.length === 0) return null;
    const ativa = lista.find(s => s.status === 'EM_ANDAMENTO');
    return ativa || lista[0];
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
        localStorage.setItem(STORAGE_KEY_ESCALA_DIAS, JSON.stringify(this.escalaDias()));
        localStorage.setItem(STORAGE_KEY_TAREFAS, JSON.stringify(this.tarefas()));
        localStorage.setItem(STORAGE_KEY_HISTORICO, JSON.stringify(this.historico()));
        localStorage.setItem(STORAGE_KEY_HISTORICO_ACOES, JSON.stringify(this.historicoAcoes()));
        const ativo = this.moradorAtivo();
        if (ativo) {
          localStorage.setItem(STORAGE_KEY_MORADOR_ATIVO, JSON.stringify(ativo));
        } else {
          localStorage.removeItem(STORAGE_KEY_MORADOR_ATIVO);
        }
      }
    });

    // Inicia o monitoramento ativo de virada de dia e de mês
    this.iniciarMonitoramentoData();

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

    // Inicializa sincronização e canais Realtime com o Supabase
    this.inicializarSupabase();
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

    // Cada semana é direcionada para cada morador:
    // Se a escala estiver vazia, gera para o novo morador; se já houver escala, adiciona uma semana dedicada a ele
    const escalaAtual = this.escala();
    if (escalaAtual.length === 0) {
      this.escala.set(this.gerarEscalaParaMoradores(novosMoradores));
    } else {
      const ultima = escalaAtual[escalaAtual.length - 1];
      const proximaDataInicio = new Date(ultima.dataFim);
      proximaDataInicio.setDate(proximaDataInicio.getDate() + 1);
      proximaDataInicio.setHours(0, 0, 0, 0);

      const proximaDataFim = new Date(proximaDataInicio);
      proximaDataFim.setDate(proximaDataInicio.getDate() + 6);
      proximaDataFim.setHours(23, 59, 59, 999);

      const novaSemana: EscalaSemana = {
        semanaId: `sem-${escalaAtual.length + 1}-${novo.id}`,
        dataInicio: proximaDataInicio,
        dataFim: proximaDataFim,
        responsaveis: [novo],
        responsavel: novo,
        status: 'PENDENTE'
      };

      this.escala.set([...escalaAtual, novaSemana]);
    }

    // Persiste no Supabase
    this.inserirMoradorNoSupabase(novo);
    this.persistirEscalaNoSupabase();

    // Registra ação no Histórico do Sistema e exibe feedback visual
    this.registrarAcaoSistema('INCLUSAO', `Morador(a) "${novo.nome}" foi incluído(a) na escala do CleanUp.`);
    this.exibirToast(`Morador(a) "${novo.nome}" cadastrado(a) com sucesso!`, 'sucesso');

    return novo;
  }

  removerMorador(id: string): void {
    const moradorRemovido = this.moradores().find(m => m.id === id);
    const novosMoradores = this.moradores().filter(m => m.id !== id);
    this.moradores.set(novosMoradores);

    // REGRA 1: Sempre que uma pessoa sair, TUDO sobre ela é apagado do histórico e das tarefas
    this.historico.update(lista => lista.filter(reg => reg.moradorId !== id));
    this.safeRun(supabase.from('historico_limpeza').delete().eq('morador_id', id));

    if (novosMoradores.length === 0) {
      this.moradorAtivo.set(null);
      this.escala.set([]);
      this.escalaDias.set({});
      this.excluirMoradorDoSupabase(id);
      this.persistirEscalaNoSupabase();
      this.registrarAcaoSistema('EXCLUSAO', `Morador(a) "${moradorRemovido?.nome || 'Membro'}" foi excluído(a) e todos os registros foram apagados.`);
      this.exibirToast(`Morador(a) "${moradorRemovido?.nome || 'Membro'}" e todos os seus dados foram excluídos.`, 'aviso');
      return;
    }

    if (this.moradorAtivo()?.id === id) {
      this.moradorAtivo.set(novosMoradores[0]);
    }

    // Remove o morador de todas as semanas da escala
    let semanasAtualizadas: EscalaSemana[] = this.escala().map(sem => {
      const novosResponsaveis = (sem.responsaveis || []).filter(m => m.id !== id);
      return {
        ...sem,
        responsaveis: novosResponsaveis,
        responsavel: novosResponsaveis.length > 0 ? novosResponsaveis[0] : null
      };
    });

    // Se havia mais semanas do que moradores restantes, remove a semana que ficou sem responsáveis
    if (semanasAtualizadas.length > novosMoradores.length) {
      const idxVazia = semanasAtualizadas.findIndex(s => s.responsaveis.length === 0);
      if (idxVazia >= 0) {
        semanasAtualizadas.splice(idxVazia, 1);
      }
    }

    // Se todas as semanas ficaram vazias, regenera a escala 1-para-1 com os moradores restantes
    if (semanasAtualizadas.length === 0 || !semanasAtualizadas.some(s => s.responsaveis.length > 0)) {
      semanasAtualizadas = this.gerarEscalaParaMoradores(novosMoradores);
    } else {
      // Garante que há pelo menos uma semana em andamento
      if (!semanasAtualizadas.some(s => s.status === 'EM_ANDAMENTO')) {
        semanasAtualizadas[0].status = 'EM_ANDAMENTO';
      }
    }

    this.escala.set(semanasAtualizadas);

    // Remove o morador de todas as atribuições específicas de dias
    this.escalaDias.update(mapa => {
      const novo: Record<string, string[]> = {};
      for (const [dataIso, ids] of Object.entries(mapa)) {
        novo[dataIso] = ids.filter(mId => mId !== id);
      }
      return novo;
    });

    this.excluirMoradorDoSupabase(id);
    this.persistirEscalaNoSupabase();

    // Registra ação no Histórico do Sistema e exibe feedback visual
    this.registrarAcaoSistema('EXCLUSAO', `Morador(a) "${moradorRemovido?.nome || 'Membro'}" foi excluído(a) e todos os seus registros foram apagados.`);
    this.exibirToast(`Morador(a) "${moradorRemovido?.nome || 'Membro'}" e todos os seus dados foram excluídos.`, 'aviso');
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

    // Cada semana é direcionada para cada morador limpar (1 semana por morador)
    for (let i = 0; i < moradores.length; i++) {
      const dataInicio = new Date(baseSegunda);
      dataInicio.setDate(baseSegunda.getDate() + i * 7);

      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataInicio.getDate() + 6);
      dataFim.setHours(23, 59, 59, 999);

      const moradorResp = moradores[i];

      escala.push({
        semanaId: `sem-${i + 1}-${moradorResp.id}`,
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
    const totalSemanas = moradores.length;

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

    this.persistirEscalaNoSupabase();
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

    this.persistirEscalaNoSupabase();
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

    this.persistirEscalaNoSupabase();
  }

  /**
   * Remove todos os moradores de uma semana específica (deixa a semana vazia)
   */
  limparMoradoresDaSemana(semanaId: string): void {
    this.escala.update(semanas =>
      semanas.map(sem =>
        sem.semanaId === semanaId
          ? { ...sem, responsaveis: [], responsavel: null }
          : sem
      )
    );

    this.persistirEscalaNoSupabase();
  }

  /**
   * Adiciona uma nova semana futura ao final da escala
   */
  adicionarSemanaNaEscala(): void {
    const semanas = this.escala();
    let dataInicio: Date;

    if (semanas.length > 0) {
      const ultima = semanas[semanas.length - 1];
      dataInicio = new Date(ultima.dataFim);
      dataInicio.setDate(dataInicio.getDate() + 1);
      dataInicio.setHours(0, 0, 0, 0);
    } else {
      const hoje = new Date();
      const diaSemana = hoje.getDay();
      const diffParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
      dataInicio = new Date(hoje);
      dataInicio.setDate(hoje.getDate() + diffParaSegunda);
      dataInicio.setHours(0, 0, 0, 0);
    }

    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataInicio.getDate() + 6);
    dataFim.setHours(23, 59, 59, 999);

    const novaSemana: EscalaSemana = {
      semanaId: `sem-${semanas.length + 1}-${Date.now()}`,
      dataInicio,
      dataFim,
      responsaveis: [],
      responsavel: null,
      status: 'PENDENTE'
    };

    this.escala.update(s => [...s, novaSemana]);
    this.persistirEscalaNoSupabase();
  }

  /**
   * Remove uma semana planejada (não permite remover a semana atual em andamento)
   */
  removerSemana(semanaId: string): void {
    this.escala.update(semanas => {
      if (semanas.length <= 1 || semanas[0].semanaId === semanaId) return semanas;
      return semanas.filter(s => s.semanaId !== semanaId);
    });

    this.persistirEscalaNoSupabase();
  }

  /**
   * Redefine a escala de rodízio equilibrada entre todos os moradores cadastrados (1 semana por morador)
   */
  redefinirEscala(): void {
    const moradores = this.moradores();
    if (moradores.length === 0) {
      this.escala.set([]);
      this.persistirEscalaNoSupabase();
      return;
    }

    const novaEscala = this.gerarEscalaParaMoradores(moradores);
    this.escala.set(novaEscala);

    if (novaEscala[0] && novaEscala[0].responsaveis.length > 0) {
      this.setMoradorAtivo(novaEscala[0].responsaveis[0]);
    }

    this.persistirEscalaNoSupabase();
  }

  // MÉTODOS DE CONTROLE DO CALENDÁRIO MENSAL DA ESCALA

  mudarMesVisualizacao(ano: number, mes: number): void {
    this.mesVisualizacao.set({ ano, mes });
  }

  avancarMes(): void {
    const { ano, mes } = this.mesVisualizacao();
    const proximoAno = mes === 11 ? ano + 1 : ano;
    const proximoMes = mes === 11 ? 0 : mes + 1;
    this.mudarMesVisualizacao(proximoAno, proximoMes);
  }

  voltarMes(): void {
    const { ano, mes } = this.mesVisualizacao();
    const anteriorAno = mes === 0 ? ano - 1 : ano;
    const anteriorMes = mes === 0 ? 11 : mes - 1;
    this.mudarMesVisualizacao(anteriorAno, anteriorMes);
  }

  irParaMesAtual(): void {
    const agora = new Date();
    this.dataHoje.set(agora);
    this.mudarMesVisualizacao(agora.getFullYear(), agora.getMonth());
  }

  formatarDataIso(data: Date): string {
    const ano = data.getFullYear();
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const dia = data.getDate().toString().padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  obterMoradoresDoDia(data: Date | string): Morador[] {
    const dataIso = typeof data === 'string' ? data : this.formatarDataIso(data);
    const dias = this.escalaDias();
    const todosMoradores = this.moradores();

    // 1. Se tem atribuição específica salva para este dia (inclusive se foi esvaziado explicitamente com [])
    if (Object.prototype.hasOwnProperty.call(dias, dataIso)) {
      const ids = dias[dataIso] || [];
      return ids
        .map(id => todosMoradores.find(m => m.id === id))
        .filter((m): m is Morador => !!m);
    }

    // 2. Fallback: verifica se o dia se enquadra em uma semana cadastrada na escala
    const partes = dataIso.split('-');
    const targetDate = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]), 12, 0, 0, 0);

    const semanas = this.escala();
    const sem = semanas.find(s => {
      const ini = new Date(s.dataInicio);
      ini.setHours(0, 0, 0, 0);
      const fim = new Date(s.dataFim);
      fim.setHours(23, 59, 59, 999);
      return targetDate >= ini && targetDate <= fim;
    });

    if (sem && sem.responsaveis && sem.responsaveis.length > 0) {
      return sem.responsaveis;
    }

    // 3. Revezamento contínuo cíclico na virada de meses caso caia além das semanas iniciais
    if (todosMoradores.length > 0 && semanas.length > 0) {
      const baseIni = new Date(semanas[0].dataInicio);
      baseIni.setHours(12, 0, 0, 0);
      const diffDias = Math.floor((targetDate.getTime() - baseIni.getTime()) / (1000 * 60 * 60 * 24));
      const diffSemanas = Math.floor(diffDias / 7);
      const cicloIndex = ((diffSemanas % todosMoradores.length) + todosMoradores.length) % todosMoradores.length;
      const moradorCiclo = todosMoradores[cicloIndex];
      return moradorCiclo ? [moradorCiclo] : [];
    }

    return [];
  }

  atribuirMoradorAoDia(dataIso: string, moradorId: string): void {
    const atuais = this.obterMoradoresDoDia(dataIso);
    if (atuais.some(m => m.id === moradorId)) return;

    const novosIds = [...atuais.map(m => m.id), moradorId];
    this.escalaDias.update(mapa => ({
      ...mapa,
      [dataIso]: novosIds
    }));

    // Se o dia atribuído for hoje, garante que o morador ativo fique alinhado
    const hojeIso = this.formatarDataIso(this.dataHoje());
    if (dataIso === hojeIso) {
      const m = this.moradores().find(item => item.id === moradorId);
      if (m && !this.moradorAtivo()) {
        this.setMoradorAtivo(m);
      }
    }
  }

  removerMoradorDoDia(dataIso: string, moradorId: string): void {
    const atuais = this.obterMoradoresDoDia(dataIso);
    const novosIds = atuais.filter(m => m.id !== moradorId).map(m => m.id);
    this.escalaDias.update(mapa => ({
      ...mapa,
      [dataIso]: novosIds
    }));
  }

  moverMoradorEntreDias(moradorId: string, origemDataIso: string | null, destinoDataIso: string): void {
    if (origemDataIso === destinoDataIso) return;

    if (origemDataIso) {
      this.removerMoradorDoDia(origemDataIso, moradorId);
    }
    this.atribuirMoradorAoDia(destinoDataIso, moradorId);
  }

  limparDia(dataIso: string): void {
    this.escalaDias.update(mapa => ({
      ...mapa,
      [dataIso]: []
    }));
  }

  nomeDoMes(mes: number): string {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[mes] || '';
  }

  limparMes(ano: number, mes: number): void {
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const mapaAtual = { ...this.escalaDias() };
    for (let d = 1; d <= diasNoMes; d++) {
      const dataIso = `${ano}-${(mes + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      mapaAtual[dataIso] = [];
    }
    this.escalaDias.set(mapaAtual);

    this.registrarAcaoSistema('EXCLUSAO', `Plantões do mês de ${this.nomeDoMes(mes)} de ${ano} foram limpos.`);
    this.exibirToast(`Plantões de ${this.nomeDoMes(mes)} foram limpos.`, 'aviso');
  }

  obterSemanasDoMes(ano: number, mes: number): EscalaSemana[] {
    // Retorna as semanas da escala de rodízio ativa onde cada semana é direcionada a cada morador
    return this.escala();
  }

  gerarSemanasParaMes(ano: number, mes: number, moradoresLista?: Morador[]): EscalaSemana[] {
    const moradores = moradoresLista || this.moradores();
    return this.gerarEscalaParaMoradores(moradores);
  }

  equilibrarMes(ano?: number, mes?: number): void {
    const visualizacao = this.mesVisualizacao();
    const targetAno = ano !== undefined ? ano : visualizacao.ano;
    const targetMes = mes !== undefined ? mes : visualizacao.mes;

    this.redefinirEscala();

    // Remove eventuais overrides manuais do mês para voltar ao equilíbrio do rodízio regular
    const prefixoMes = `${targetAno}-${(targetMes + 1).toString().padStart(2, '0')}`;
    this.escalaDias.update(dias => {
      const novo: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(dias)) {
        if (!k.startsWith(prefixoMes)) {
          novo[k] = v;
        }
      }
      return novo;
    });

    this.registrarAcaoSistema('ALTERACAO', `Escala do mês de ${this.nomeDoMes(targetMes)} foi redistribuída e equilibrada.`);
    this.exibirToast(`Escala de ${this.nomeDoMes(targetMes)} equilibrada com sucesso!`, 'sucesso');
  }

  adicionarSemanaNoMes(ano: number, mes: number): void {
    this.adicionarSemanaNaEscala();
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

    let novoRegistro: RegistroLimpeza | null = null;
    if (novoEstado && morador) {
      novoRegistro = {
        id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        moradorId: morador.id,
        moradorNome: morador.nome,
        tarefaNome: tarefaAlvo.titulo,
        dataHora: new Date()
      };

      this.historico.update(logs => [novoRegistro!, ...logs]);
    }

    // Sincroniza com o Supabase
    this.atualizarTarefaNoSupabase(tarefaId, novoEstado);
    if (novoRegistro) {
      this.inserirHistoricoNoSupabase(novoRegistro);
      this.exibirToast(`Tarefa "${tarefaAlvo.titulo}" concluída por ${morador?.nome}!`, 'sucesso');
    } else {
      this.exibirToast(`Tarefa "${tarefaAlvo.titulo}" desmarcada.`, 'info');
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
    this.inserirTarefaNoSupabase(nova);

    this.registrarAcaoSistema('INCLUSAO', `Nova tarefa "${nova.titulo}" incluída no cômodo ${comodo}.`);
    this.exibirToast(`Tarefa "${nova.titulo}" incluída com sucesso!`, 'sucesso');
  }

  removerTarefa(tarefaId: string): void {
    const tarefaAlvo = this.tarefas().find(t => t.id === tarefaId);
    this.tarefas.update(lista => lista.filter(t => t.id !== tarefaId));
    this.excluirTarefaDoSupabase(tarefaId);

    if (tarefaAlvo) {
      this.registrarAcaoSistema('EXCLUSAO', `Tarefa "${tarefaAlvo.titulo}" (${tarefaAlvo.comodo}) foi excluída.`);
      this.exibirToast(`Tarefa "${tarefaAlvo.titulo}" excluída com sucesso.`, 'aviso');
    }
  }

  reiniciarCicloSemanal(): void {
    this.tarefas.update(lista => lista.map(t => ({ ...t, concluida: false })));
    this.escala.update(items =>
      items.map((item, idx) => ({
        ...item,
        status: idx === 0 ? 'EM_ANDAMENTO' : 'PENDENTE'
      }))
    );

    const primeira = this.escala()[0];
    if (primeira && primeira.responsaveis.length > 0) {
      this.setMoradorAtivo(primeira.responsaveis[0]);
    }

    this.resetarTarefasNoSupabase();
    this.persistirEscalaNoSupabase();
  }

  avancarSemana(): void {
    const lista = this.escala();
    if (lista.length === 0) return;

    const moradores = this.moradores();
    if (moradores.length === 0) return;

    const indexAtual = lista.findIndex(s => s.status === 'EM_ANDAMENTO');
    let novaLista: EscalaSemana[];

    if (indexAtual >= 0 && indexAtual < lista.length - 1) {
      // Avança para a próxima semana existente no rodízio
      novaLista = lista.map((sem, idx) => {
        if (idx === indexAtual) {
          return { ...sem, status: 'CONCLUIDO' };
        } else if (idx === indexAtual + 1) {
          return { ...sem, status: 'EM_ANDAMENTO' };
        }
        return sem;
      });

      const proxima = novaLista[indexAtual + 1];
      if (proxima && proxima.responsaveis.length > 0) {
        this.setMoradorAtivo(proxima.responsaveis[0]);
      }
    } else {
      // Chegou ao fim do ciclo ou nenhuma semana em andamento:
      // Reinicia o rodízio na primeira semana para o próximo ciclo de datas
      const ultimaSemana = lista[lista.length - 1];
      const proximaDataInicio = new Date(ultimaSemana.dataFim);
      proximaDataInicio.setDate(proximaDataInicio.getDate() + 1);
      proximaDataInicio.setHours(0, 0, 0, 0);

      novaLista = lista.map((sem, idx) => {
        const dataInicio = new Date(proximaDataInicio);
        dataInicio.setDate(proximaDataInicio.getDate() + idx * 7);

        const dataFim = new Date(dataInicio);
        dataFim.setDate(dataInicio.getDate() + 6);
        dataFim.setHours(23, 59, 59, 999);

        return {
          ...sem,
          dataInicio,
          dataFim,
          status: idx === 0 ? 'EM_ANDAMENTO' : 'PENDENTE'
        };
      });

      if (novaLista[0] && novaLista[0].responsaveis.length > 0) {
        this.setMoradorAtivo(novaLista[0].responsaveis[0]);
      }
    }

    this.escala.set(novaLista);
    this.tarefas.update(tList => tList.map(t => ({ ...t, concluida: false })));

    this.resetarTarefasNoSupabase();
    this.persistirEscalaNoSupabase();

    const novoResponsavel = this.semanaAtual()?.responsaveis[0]?.nome || 'Membro';
    this.registrarAcaoSistema('ALTERACAO', `Ciclo semanal avançado. Responsável da semana: ${novoResponsavel}.`);
    this.exibirToast(`Semana avançada! Responsável atual: ${novoResponsavel}`, 'info');
  }

  limparHistorico(): void {
    this.historico.set([]);
    this.limparHistoricoNoSupabase();
    this.registrarAcaoSistema('EXCLUSAO', 'Histórico de tarefas de limpeza foi esvaziado.');
  }

  // CONTROLE DE CONFIRMAÇÕES VISUAIS (REGRA 2)
  solicitarConfirmacao(pedido: PedidoConfirmacao): void {
    this.confirmacaoPendente.set(pedido);
  }

  confirmarAcao(): void {
    const pedido = this.confirmacaoPendente();
    if (pedido) {
      pedido.acaoConfirmar();
    }
    this.confirmacaoPendente.set(null);
  }

  cancelarConfirmacao(): void {
    this.confirmacaoPendente.set(null);
  }

  // CONTROLE DE TOASTS VISUAIS (REGRA 5)
  exibirToast(mensagem: string, tipo: 'sucesso' | 'erro' | 'info' | 'aviso' = 'sucesso', titulo?: string): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const tituloPadrao = titulo || (tipo === 'sucesso' ? 'Sucesso!' : tipo === 'erro' ? 'Erro' : tipo === 'aviso' ? 'Atenção' : 'CleanUp');
    const novo: ToastNotificacao = { id, tipo, mensagem, titulo: tituloPadrao };
    this.toasts.update(lista => [...lista, novo]);

    setTimeout(() => {
      this.removerToast(id);
    }, 4000);
  }

  removerToast(id: string): void {
    this.toasts.update(lista => lista.filter(t => t.id !== id));
  }

  // REGISTRO DE AÇÕES DO SISTEMA (REGRA 6)
  registrarAcaoSistema(tipo: AcaoSistema['tipo'], descricao: string, autorNome?: string): void {
    const autor = autorNome || this.moradorAtivo()?.nome || 'CleanUp';
    const novaAcao: AcaoSistema = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tipo,
      descricao,
      autorNome: autor,
      dataHora: new Date()
    };
    this.historicoAcoes.update(lista => [novaAcao, ...lista]);
  }

  limparHistoricoAcoes(): void {
    this.historicoAcoes.set([]);
  }

  setMoradorAtivo(morador: Morador | null): void {
    this.moradorAtivo.set(morador);
    if (morador) {
      this.exibirToast(`Perfil ativo: ${morador.nome}`, 'info');
    }
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

  // ==========================================
  // INTEGRAÇÃO COM SUPABASE E TEMPO REAL (REALTIME)
  // ==========================================

  private async inicializarSupabase(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      this.sincronizandoComNuvem.set(true);
      await this.sincronizarComSupabase();
      this.iniciarRealtime();
    } catch (err) {
      console.warn('[CleanUp] Supabase em modo offline ou aguardando criação das tabelas:', err);
    } finally {
      this.sincronizandoComNuvem.set(false);
    }
  }

  private async sincronizarComSupabase(): Promise<void> {
    try {
      // 1. Carrega Moradores
      const { data: mData, error: mErr } = await supabase.from('moradores').select('*');
      if (!mErr && mData && mData.length > 0) {
        const moradoresDb: Morador[] = mData.map((m: any) => ({
          id: m.id,
          nome: m.nome,
          avatarUrl: m.avatar_url
        }));
        this.moradores.set(moradoresDb);
        if (!this.moradorAtivo()) {
          this.moradorAtivo.set(moradoresDb[0]);
        }
      }

      // 2. Carrega Tarefas
      const { data: tData, error: tErr } = await supabase.from('tarefas').select('*').order('created_at', { ascending: true });
      if (!tErr && tData) {
        if (tData.length > 0) {
          const tarefasDb: Tarefa[] = tData.map((t: any) => ({
            id: t.id,
            titulo: t.titulo,
            comodo: t.comodo,
            concluida: t.concluida
          }));
          this.tarefas.set(tarefasDb);
        } else {
          // Se a tabela estiver vazia na primeira vez, inicializa com as 5 tarefas base
          await this.salvarTarefasIniciaisNoSupabase();
        }
      }

      // 3. Carrega Escala de Rodízio
      const { data: eData, error: eErr } = await supabase.from('escala').select('*').order('data_inicio', { ascending: true });
      if (!eErr && eData && eData.length > 0) {
        const escalaDb: EscalaSemana[] = eData.map((sem: any) => {
          const responsaveis: Morador[] = sem.responsaveis || [];
          return {
            semanaId: sem.semana_id,
            dataInicio: new Date(sem.data_inicio),
            dataFim: new Date(sem.data_fim),
            responsaveis,
            responsavel: responsaveis.length > 0 ? responsaveis[0] : null,
            status: sem.status
          };
        });
        this.escala.set(escalaDb);
      }

      // 4. Carrega Histórico de Limpeza
      const { data: hData, error: hErr } = await supabase.from('historico_limpeza').select('*').order('data_hora', { ascending: false }).limit(100);
      if (!hErr && hData && hData.length > 0) {
        const histDb: RegistroLimpeza[] = hData.map((h: any) => ({
          id: h.id,
          moradorId: h.morador_id,
          moradorNome: h.morador_nome,
          tarefaNome: h.tarefa_nome,
          dataHora: new Date(h.data_hora)
        }));
        this.historico.set(histDb);
      }
    } catch {
      // Falha graciosa mantendo os dados locais
    }
  }

  private iniciarRealtime(): void {
    if (this.canalRealtime) return;

    this.canalRealtime = supabase
      .channel('cleanup-live-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'moradores' }, () => {
        this.recarregarMoradoresDoSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tarefas' }, (payload) => {
        this.processarMudancaTarefaRealtime(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escala' }, () => {
        this.recarregarEscalaDoSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'historico_limpeza' }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const n = payload.new as any;
          const reg: RegistroLimpeza = {
            id: n.id,
            moradorId: n.morador_id,
            moradorNome: n.morador_nome,
            tarefaNome: n.tarefa_nome,
            dataHora: new Date(n.data_hora)
          };
          this.historico.update(lista => {
            if (lista.some(item => item.id === reg.id)) return lista;
            return [reg, ...lista];
          });
        } else {
          this.recarregarHistoricoDoSupabase();
        }
      })
      .subscribe();
  }

  private async recarregarMoradoresDoSupabase(): Promise<void> {
    try {
      const { data } = await supabase.from('moradores').select('*');
      if (data) {
        const lista: Morador[] = data.map((m: any) => ({
          id: m.id,
          nome: m.nome,
          avatarUrl: m.avatar_url
        }));
        this.moradores.set(lista);
      }
    } catch {}
  }

  private async recarregarTarefasDoSupabase(): Promise<void> {
    try {
      const { data } = await supabase.from('tarefas').select('*').order('created_at', { ascending: true });
      if (data) {
        const lista: Tarefa[] = data.map((t: any) => ({
          id: t.id,
          titulo: t.titulo,
          comodo: t.comodo,
          concluida: t.concluida
        }));
        this.tarefas.set(lista);
      }
    } catch {}
  }

  private processarMudancaTarefaRealtime(payload: any): void {
    if (payload.eventType === 'UPDATE' && payload.new) {
      const nova = payload.new;
      this.tarefas.update(lista =>
        lista.map(t => (t.id === nova.id ? { ...t, concluida: nova.concluida, titulo: nova.titulo, comodo: nova.comodo } : t))
      );
    } else {
      this.recarregarTarefasDoSupabase();
    }
  }

  private async recarregarEscalaDoSupabase(): Promise<void> {
    try {
      const { data } = await supabase.from('escala').select('*').order('data_inicio', { ascending: true });
      if (data) {
        const escalaDb: EscalaSemana[] = data.map((sem: any) => {
          const responsaveis: Morador[] = sem.responsaveis || [];
          return {
            semanaId: sem.semana_id,
            dataInicio: new Date(sem.data_inicio),
            dataFim: new Date(sem.data_fim),
            responsaveis,
            responsavel: responsaveis.length > 0 ? responsaveis[0] : null,
            status: sem.status
          };
        });
        this.escala.set(escalaDb);
      }
    } catch {}
  }

  private async recarregarHistoricoDoSupabase(): Promise<void> {
    try {
      const { data } = await supabase.from('historico_limpeza').select('*').order('data_hora', { ascending: false }).limit(100);
      if (data) {
        const hist: RegistroLimpeza[] = data.map((h: any) => ({
          id: h.id,
          moradorId: h.morador_id,
          moradorNome: h.morador_nome,
          tarefaNome: h.tarefa_nome,
          dataHora: new Date(h.data_hora)
        }));
        this.historico.set(hist);
      }
    } catch {}
  }

  private safeRun(op: PromiseLike<any>): void {
    Promise.resolve(op).catch(() => {});
  }

  private inserirMoradorNoSupabase(morador: Morador): void {
    this.safeRun(supabase.from('moradores').insert({
      id: morador.id,
      nome: morador.nome,
      avatar_url: morador.avatarUrl
    }));
  }

  private excluirMoradorDoSupabase(id: string): void {
    this.safeRun(supabase.from('moradores').delete().eq('id', id));
  }

  private atualizarTarefaNoSupabase(id: string, concluida: boolean): void {
    this.safeRun(supabase.from('tarefas').update({ concluida }).eq('id', id));
  }

  private inserirTarefaNoSupabase(tarefa: Tarefa): void {
    this.safeRun(supabase.from('tarefas').insert({
      id: tarefa.id,
      titulo: tarefa.titulo,
      comodo: tarefa.comodo,
      concluida: tarefa.concluida
    }));
  }

  private excluirTarefaDoSupabase(id: string): void {
    this.safeRun(supabase.from('tarefas').delete().eq('id', id));
  }

  private resetarTarefasNoSupabase(): void {
    this.safeRun(supabase.from('tarefas').update({ concluida: false }).neq('id', ''));
  }

  private inserirHistoricoNoSupabase(registro: RegistroLimpeza): void {
    this.safeRun(supabase.from('historico_limpeza').insert({
      id: registro.id,
      morador_id: registro.moradorId,
      morador_nome: registro.moradorNome,
      tarefa_nome: registro.tarefaNome,
      data_hora: registro.dataHora.toISOString()
    }));
  }

  private limparHistoricoNoSupabase(): void {
    this.safeRun(supabase.from('historico_limpeza').delete().neq('id', ''));
  }

  private async salvarTarefasIniciaisNoSupabase(): Promise<void> {
    try {
      const rows = this.tarefasIniciais.map(t => ({
        id: t.id,
        titulo: t.titulo,
        comodo: t.comodo,
        concluida: false
      }));
      await supabase.from('tarefas').upsert(rows);
    } catch {}
  }

  private persistirEscalaNoSupabase(): void {
    const lista = this.escala();
    if (lista.length === 0) {
      this.safeRun(supabase.from('escala').delete().neq('semana_id', ''));
      return;
    }

    const rows = lista.map(sem => ({
      semana_id: sem.semanaId,
      data_inicio: sem.dataInicio.toISOString(),
      data_fim: sem.dataFim.toISOString(),
      responsaveis: sem.responsaveis || [],
      status: sem.status
    }));

    this.safeRun(supabase.from('escala').upsert(rows));
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

  private carregarEscalaDias(): Record<string, string[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ESCALA_DIAS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private carregarHistoricoAcoes(): AcaoSistema[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_HISTORICO_ACOES);
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

  // Monitora continuamente a virada de dia e de mês
  private iniciarMonitoramentoData(): void {
    if (typeof window === 'undefined') return;

    const verificarVirada = () => {
      const agora = new Date();
      const anterior = this.dataHoje();

      const virouDia = agora.getDate() !== anterior.getDate();
      const virouMes = agora.getMonth() !== anterior.getMonth() || agora.getFullYear() !== anterior.getFullYear();

      if (virouDia || virouMes) {
        const estavaNoMesAtual =
          this.mesVisualizacao().ano === anterior.getFullYear() &&
          this.mesVisualizacao().mes === anterior.getMonth();

        this.dataHoje.set(agora);

        // Se o usuário estava visualizando o mês atual quando virou o mês, avança automaticamente
        if (virouMes && estavaNoMesAtual) {
          this.mesVisualizacao.set({
            ano: agora.getFullYear(),
            mes: agora.getMonth()
          });
        }
      }
    };

    // Verificação periódica a cada 30 segundos
    try {
      setInterval(verificarVirada, 30000);
    } catch {}

    // Verificação imediata quando o usuário volta à aba do navegador
    if (typeof document !== 'undefined') {
      try {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            verificarVirada();
          }
        });
      } catch {}
    }
  }
}
