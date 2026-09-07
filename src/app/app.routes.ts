import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'public/firmar-acta',
    loadComponent: () =>
      import('./pages/public/firma-disciplinaria.component').then(
        (m) => m.FirmaDisciplinariaComponent,
      ),
  },
  {
    path: 'public/firmar-matricula',
    loadComponent: () =>
      import('./pages/public/firma-matricula.component').then(
        (m) => m.FirmaMatriculaComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
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
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'academico',
        loadComponent: () =>
          import('./pages/academico/academico.component').then(
            (m) => m.AcademicoComponent,
          ),
      },
      {
        path: 'lms',
        loadComponent: () =>
          import('./pages/lms/lms.component').then((m) => m.LmsComponent),
      },
      {
        path: 'asistencia',
        loadComponent: () =>
          import('./pages/asistencia/asistencia.component').then(
            (m) => m.AsistenciaComponent,
          ),
      },
      {
        path: 'matriculas',
        loadComponent: () =>
          import('./pages/matriculas/matriculas.component').then(
            (m) => m.MatriculasComponent,
          ),
      },
      {
        path: 'tesoreria',
        loadComponent: () =>
          import('./pages/tesoreria/tesoreria.component').then(
            (m) => m.TesoreriaComponent,
          ),
      },
      {
        path: 'contabilidad',
        loadComponent: () =>
          import('./pages/contabilidad/contabilidad.component').then(
            (m) => m.ContabilidadComponent,
          ),
      },
      {
        path: 'educore-ai',
        loadComponent: () =>
          import('./pages/educore-ai/educore-ai.component').then(
            (m) => m.EducoreAiComponent,
          ),
      },
      {
        path: 'gobierno-escolar',
        loadComponent: () =>
          import('./pages/gobierno-escolar/gobierno-escolar.component').then(
            (m) => m.GobiernoEscolarComponent,
          ),
      },
      {
        path: 'convivencia',
        loadComponent: () =>
          import('./pages/convivencia/convivencia.component').then(
            (m) => m.ConvivenciaComponent,
          ),
      },
      {
        path: 'inclusion',
        loadComponent: () =>
          import('./pages/inclusion/inclusion.component').then(
            (m) => m.InclusionComponent,
          ),
      },
      {
        path: 'habeas-data',
        loadComponent: () =>
          import('./pages/habeas-data/habeas-data.component').then(
            (m) => m.HabeasDataComponent,
          ),
      },
      {
        path: 'comunicaciones',
        loadComponent: () =>
          import('./pages/comunicaciones/comunicaciones.component').then(
            (m) => m.ComunicacionesComponent,
          ),
      },
      {
        path: 'documental',
        loadComponent: () =>
          import('./pages/documental/documental.component').then(
            (m) => m.DocumentalComponent,
          ),
      },
      {
        path: 'importador',
        loadComponent: () =>
          import('./pages/importador/importador.component').then(
            (m) => m.ImportadorComponent,
          ),
      },
      {
        path: 'porteria',
        loadComponent: () =>
          import('./pages/porteria/porteria.component').then(
            (m) => m.PorteriaComponent,
          ),
      },
      {
        path: 'talento-humano',
        loadComponent: () =>
          import('./pages/talento-humano/talento-humano.component').then(
            (m) => m.TalentoHumanoComponent,
          ),
      },
      {
        path: 'rrhh',
        redirectTo: 'talento-humano',
        pathMatch: 'full',
      },
      {
        path: 'transporte-restaurante',
        loadComponent: () =>
          import(
            './pages/transporte-restaurante/transporte-restaurante.component'
          ).then((m) => m.TransporteRestauranteComponent),
      },
      {
        path: 'transporte',
        redirectTo: 'transporte-restaurante',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
