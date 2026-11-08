export interface Morador {
  id: string;
  nome: string;
  avatarUrl?: string;
}

export interface Tarefa {
  id: string;
  titulo: string;
  comodo: 'Cozinha' | 'Banheiro' | 'Sala' | 'Corredor' | 'Área de Serviço' | 'Área Comum' | 'Varanda' | string;
  concluida: boolean;
}

export interface RegistroLimpeza {
  id: string;
  moradorId: string;
  moradorNome: string;
  tarefaNome: string;
  dataHora: Date; // Armazena a data e hora exata da marcação
}

export interface EscalaSemana {
  semanaId: string;
  dataInicio: Date;
  dataFim: Date;
  responsavel?: Morador | null; // Responsável primário (retrocompatibilidade)
  responsaveis: Morador[];      // Lista de moradores escalados (pode ser 0, 1 ou múltiplos)
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';
}

/**
 * Histórico de Ações Administrativas e Cadastrais do CleanUp
 * (Completamente separado do histórico de limpeza de tarefas)
 */
export interface AcaoSistema {
  id: string;
  tipo: 'INCLUSAO' | 'EXCLUSAO' | 'ALTERACAO' | 'SISTEMA';
  descricao: string;
  autorNome?: string;
  dataHora: Date;
}

/**
 * Modelo para Solicitação de Confirmação Visual
 */
export interface PedidoConfirmacao {
  titulo: string;
  mensagem: string;
  tipo: 'incluir' | 'excluir' | 'aviso';
  textoBotaoConfirmar?: string;
  acaoConfirmar: () => void;
}

/**
 * Modelo para Toast de Feedback Visual
 */
export interface ToastNotificacao {
  id: string;
  tipo: 'sucesso' | 'erro' | 'info' | 'aviso';
  titulo?: string;
  mensagem: string;
}
