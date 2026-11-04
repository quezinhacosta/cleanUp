# CleanUp 🧹✨

Aplicação web moderna para gerenciar e monitorar a escala de limpeza . O objetivo primordial do **CleanUp** é garantir **transparência total** e eliminar o desfalque nas tarefas: quem fez o que, qual tarefa foi realizada, em qual data e no horário exato com precisão de segundos.

---

## 🚀 Tecnologias Utilizadas

- **Angular 21** (Componentes 100% Standalone, controle de fluxo `@if`, `@for`, `@switch`)
- **Angular Signals** (`signal`, `computed`, `effect`) para gerenciamento reativo e performático de estado
- **Tailwind CSS v3** com design clean, luminoso (*Light Mode* moderno) e paleta em Slate, Azul Real (`blue-600`) e Verde Esmeralda (`emerald-500`)
- **Vitest** como test runner nativo de altíssima velocidade
- **LocalStorage API** com hidratação automática para persistência dos dados entre sessões

---

## 📱 Módulos & Estrutura da Aplicação

1. **Header / Navbar:**
   - Logotipo CleanUp com badge pulsante de *"Plantão Ativo"*.
   - Seletor de morador ativo (*"Registrando como: Lucas Silva ▾"*), permitindo simular e alternar quem está concluindo a tarefa.

2. **A. Painel do Responsável da Semana (CleanUp Dashboard):**
   - Card em destaque com avatar, nome, intervalo de datas (`03/11 a 09/11`) e badge de status (`PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDO`).
   - Indicador visual dinâmico com barra de progresso e porcentagem de tarefas executadas.
   - Ação rápida para *"Avançar Rodízio"* ou *"Reiniciar Ciclo"*.

3. **B. Checklist de Tarefas da Semana:**
   - Lista interativa categorizada por cômodos: *Cozinha*, *Banheiro*, *Sala*, *Área Comum*, *Varanda*.
   - Filtro rápido por cômodo em pills horizontais.
   - Conclusão com 1 clique gerando carimbo de auditoria em tempo real.
   - Modal para cadastro rápido de novas tarefas personalizadas.

4. **C. Feed / Histórico de Atividades (Log de Transparência):**
   - Tabela e feed com registros imutáveis: `[Morador]` + `[Tarefa Realizada]` + `[Data]` + `[Hora precisa (HH:mm:ss)]`.
   - Filtro instantâneo por morador ou por busca textual de tarefa.

5. **D. Visão da Escala de Rodízio:**
   - Sequência cronológica das próximas semanas com seus respectivos moradores responsáveis e datas de início/fim.

---

## 📦 Modelos de Dados (`src/app/models/cleanup.model.ts`)

```typescript
export interface Morador {
  id: string;
  nome: string;
  avatarUrl?: string;
}

export interface Tarefa {
  id: string;
  titulo: string;
  comodo: 'Cozinha' | 'Banheiro' | 'Sala' | 'Área Comum' | 'Varanda';
  concluida: boolean;
}

export interface RegistroLimpeza {
  id: string;
  moradorId: string;
  moradorNome: string;
  tarefaNome: string;
  dataHora: Date; // Data e hora exata da marcação
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

## 🛠️ Como Executar o Projeto

```bash
# 1. Acesse o diretório do projeto
cd cleanUp

# 2. Inicie o servidor de desenvolvimento
npm start
# ou: ng serve

# 3. Acesse no navegador:
# http://localhost:4200
```

---

## 🧪 Testes Unitários

O projeto possui 100% de cobertura nos requisitos principais:

```bash
npm test
```

Foram implementados testes automatizados cobrindo:
- Criação e integridade dos componentes standalone
- Alternância de tarefas e geração automática de registro com carimbo `Date` e `HH:mm:ss`
- Cálculo de porcentagem do ciclo
- Filtros por morador e por tarefa no histórico
- Adição e remoção de tarefas
- Rotação e avanço da escala de rodízio

---

## 🏗️ Build de Produção

```bash
npm run build
```
Os arquivos otimizados serão gerados na pasta `dist/cleanUp`.
