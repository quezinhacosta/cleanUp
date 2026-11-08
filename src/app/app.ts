import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CleanupService } from './services/cleanup.service';
import { HeaderComponent } from './components/header/header.component';
import { ChecklistTarefasComponent } from './components/checklist-tarefas/checklist-tarefas.component';
import { HistoricoAtividadesComponent } from './components/historico-atividades/historico-atividades.component';
import { EscalaRodizioComponent } from './components/escala-rodizio/escala-rodizio.component';
import { GerenciarMembrosComponent } from './components/gerenciar-membros/gerenciar-membros.component';
import { SeletorPerfilComponent } from './components/seletor-perfil/seletor-perfil.component';
import { ModalConfirmacaoComponent } from './components/modal-confirmacao/modal-confirmacao.component';
import { HistoricoAcoesComponent } from './components/historico-acoes/historico-acoes.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SeletorPerfilComponent,
    ChecklistTarefasComponent,
    HistoricoAtividadesComponent,
    EscalaRodizioComponent,
    GerenciarMembrosComponent,
    ModalConfirmacaoComponent,
    HistoricoAcoesComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  service = inject(CleanupService);
}
