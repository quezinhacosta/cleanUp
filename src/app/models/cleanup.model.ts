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
  responsavel: Morador;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';
}

