import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AcademicoComponent } from './pages/academico/academico.component';
import { MatriculasComponent } from './pages/matriculas/matriculas.component';
import { TesoreriaComponent } from './pages/tesoreria/tesoreria.component';
import { EducoreAiComponent } from './pages/educore-ai/educore-ai.component';
import { GobiernoEscolarComponent } from './pages/gobierno-escolar/gobierno-escolar.component';
import { ImportadorComponent } from './pages/importador/importador.component';
import { DocumentalComponent } from './pages/documental/documental.component';
import { LmsComponent } from './pages/lms/lms.component';
import { ConvivenciaComponent } from './pages/convivencia/convivencia.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'academico',
        component: AcademicoComponent,
      },
      {
        path: 'lms',
        component: LmsComponent,
      },
      {
        path: 'matriculas',
        component: MatriculasComponent,
      },
      {
        path: 'tesoreria',
        component: TesoreriaComponent,
      },
      {
        path: 'educore-ai',
        component: EducoreAiComponent,
      },
      {
        path: 'gobierno-escolar',
        component: GobiernoEscolarComponent,
      },
      {
        path: 'convivencia',
        component: ConvivenciaComponent,
      },
      {
        path: 'documental',
        component: DocumentalComponent,
      },
      {
        path: 'importador',
        component: ImportadorComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
