import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Ruta de Login (Pública / Solo sin sesión)
  {
    path: 'login',
    canActivate: [guestGuard],
    data: { layout: 'bare' },
    loadComponent: () => import('./login/login').then(m => m.LoginComponent)
  },

  // Ruta de Registro (Pública / Solo sin sesión)
  {
    path: 'register',
    canActivate: [guestGuard],
    data: { layout: 'bare' },
    loadComponent: () => import('./register/register').then(m => m.RegisterComponent)
  },

  // Rutas de Estudiante (Layout 'app' con sidebar de estudiante)
  {
    path: 'dashboard',
    canActivate: [roleGuard('estudiante')],
    data: { layout: 'app' },
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent)
  },
  {
    path: 'virtual-lab',
    canActivate: [roleGuard('estudiante')],
    data: { layout: 'app' },
    loadComponent: () => import('./virtual-lab/virtual-lab').then(m => m.VirtualLabComponent)
  },
  {
    path: 'periodic-table',
    canActivate: [roleGuard('estudiante')],
    data: { layout: 'app' },
    loadComponent: () => import('./periodic-table/periodic-table').then(m => m.PeriodicTableComponent)
  },
  {
    path: 'tabla-periodica',
    redirectTo: 'periodic-table',
    pathMatch: 'full'
  },
  {
    path: 'profile',
    canActivate: [roleGuard('estudiante')],
    data: { layout: 'app' },
    loadComponent: () => import('./profile/profile').then(m => m.ProfileComponent)
  },
  {
    path: 'mision-organica',
    canActivate: [roleGuard('estudiante')],
    data: { layout: 'app' },
    loadComponent: () => import('./organic-mission/organic-mission').then(m => m.MisionOrganicaComponent)
  },
  {
    path: 'challenges',
    canActivate: [roleGuard('estudiante')],
    data: { layout: 'app' },
    loadComponent: () => import('./challenges/challenges').then(m => m.ChallengesComponent)
  },

  // Rutas compartidas por cualquier usuario autenticado
  {
    path: 'settings',
    canActivate: [authGuard],
    data: { layout: 'app' },
    loadComponent: () => import('./settings/settings').then(m => m.SettingsComponent)
  },
  {
    path: 'help',
    canActivate: [authGuard],
    data: { layout: 'app' },
    loadComponent: () => import('./help/help').then(m => m.HelpComponent)
  },

  // Rutas de Docente
  {
    path: 'teacher-dashboard',
    canActivate: [roleGuard('docente')],
    data: { layout: 'bare' }, // Incluye su propio TeacherSidebar internamente
    loadComponent: () => import('./teacher-dashboard/teacher-dashboard').then(m => m.TeacherDashboardComponent)
  },
  {
    path: 'my-classrooms',
    canActivate: [roleGuard('docente')],
    data: { layout: 'app' },
    loadComponent: () => import('./my-classrooms/my-classrooms').then(m => m.MyClassroomsComponent)
  },

  // Landing Page Pública
  {
    path: 'home',
    data: { layout: 'bare' },
    loadComponent: () => import('./home/home').then(m => m.HomeComponent)
  },

  // Redirecciones
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' }
];
