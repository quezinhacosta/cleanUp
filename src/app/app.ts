import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { DashboardResumoComponent } from './components/dashboard-resumo/dashboard-resumo.component';
import { ChecklistTarefasComponent } from './components/checklist-tarefas/checklist-tarefas.component';
import { HistoricoAtividadesComponent } from './components/historico-atividades/historico-atividades.component';
import { EscalaRodizioComponent } from './components/escala-rodizio/escala-rodizio.component';
import { GerenciarMembrosComponent } from './components/gerenciar-membros/gerenciar-membros.component';
import { SeletorPerfilComponent } from './components/seletor-perfil/seletor-perfil.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    DashboardResumoComponent,
    SeletorPerfilComponent,
    ChecklistTarefasComponent,
    HistoricoAtividadesComponent,
    EscalaRodizioComponent,
    GerenciarMembrosComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
