# CleanUp

Aplicacao web para gerenciar e monitorar a escala de limpeza de apartamentos compartilhados. O objetivo do CleanUp e garantir transparencia total e eliminar o desfalque nas tarefas: registrar quem realizou cada tarefa, em qual data e no horario exato com precisao de segundos.

Desenvolvido por Quezia Costa.

---

## Tecnologias Utilizadas

- Angular (versao atualizada, componentes 100% Standalone)
- Angular Signals (signal, computed, effect) para gerenciamento reativo de estado
- Tailwind CSS com design clean, luminoso e responsivo (mobile-first)
- jsPDF e jspdf-autotable para geracao e download de relatorios individuais e gerais em PDF
- Vitest para testes unitarios automatizados
- LocalStorage com hidratacao automatica para persistencia local de dados

---

## Modulos e Recursos da Aplicacao

1. Barra de Navegacao e Selecao de Perfil:
   - Identificacao visual do sistema e badge de status do plantao.
   - Menu suspenso interativo para alternar rapidamente entre moradores cadastrados.
   - Acesso direto ao gerenciamento de membros.

2. Seletor Rapido de Perfil:
   - Barra horizontal interativa permitindo alternar quem esta realizando as tarefas no momento com um unico clique ou toque.

3. Painel do Responsavel da Semana (Dashboard):
   - Card em destaque com o morador em plantao na semana atual, periodo de vigencia e status do ciclo (Pendente, Em Andamento, Concluido).
   - Barra de progresso visual com porcentagem de conclusao das tarefas.
   - Botoes para avancar o rodizio semanal ou reiniciar o ciclo atual.

4. Checklist de Tarefas:
   - Lista baseada nas tarefas principais: Limpar Sala, Limpar Corredor, Limpar Banheiro, Limpar Cozinha e Limpar Area de Servico.
   - Liberdade total para o usuario cadastrar novas tarefas personalizadas ou remover tarefas existentes.
   - Filtro dinamico por comodo ou setor.
   - Marcacao de conclusao com carimbo automatico de data e horario exato (HH:mm:ss).

5. Feed e Historico de Atividades (Log de Transparencia):
   - Tabela cronologica com layout responsivo e protecao contra quebras de linha.
   - Exibicao obrigatoria de: [Morador] + [Tarefa Realizada] + [Data] + [Hora precisa (HH:mm:ss)].
   - Filtro rapido por morador e busca textual por tarefa.
   - Exportacao de relatorios em formato PDF para qualquer integrante ou consolidados para todo o apartamento.

6. Visao da Escala de Rodizio:
   - Grade cronologica das semanas subsequentes com sequencia justa de revezamento.
   - Atualizacao e redistribuicao automatica dos ciclos ao adicionar ou remover membros.

7. Gerenciamento de Membros:
   - Modal para cadastrar novos moradores com geracao automatica de avatar ou foto personalizada.
   - Opcao de exclusao com readequacao automatica do rodizio.
   - Botao individual para download de relatorio em PDF diretamente no modal.

---

## Modelos de Dados (src/app/models/cleanup.model.ts)

```typescript
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
  dataHora: Date;
}

export interface EscalaSemana {
  semanaId: string;
  dataInicio: Date;
  dataFim: Date;
  responsavel: Morador;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';
}
```

---

## Instrucoes de Execucao

Para instalar dependencias (caso necessario):
```bash
cd cleanUp
npm install
```

Para iniciar o servidor de desenvolvimento:
```bash
npm start
```
Acesse no navegador pelo endereco: http://localhost:4200

Para executar a suite de testes automatizados:
```bash
npm test
```

Para gerar a build de producao otimizada:
```bash
npm run build
```
Os artefatos compilados serao gerados no diretorio dist/cleanUp.
