import { Routes } from '@angular/router';

export const routes: Routes = [
  // Ruta de Login (Pública / Autenticación)
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.LoginComponent)
  },

  // Ruta de registro
  {
    path: 'register',
    loadComponent: () => import('./register/register').then(m => m.RegisterComponent)
  },

  // Ruta del Dashboard (Dentro del Layout con Sidebar)
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent)
  },

  // Ruta del Laboratorio Virtual (Dentro del Layout con Sidebar)
  {
    path: 'virtual-lab',
    loadComponent: () => import('./virtual-lab/virtual-lab').then(m => m.VirtualLabComponent)
  },

  {
    path: 'periodic-table',
    loadComponent: () => import('./periodic-table/periodic-table').then(m => m.PeriodicTableComponent)
  },
  {
    path: 'tabla-periodica',
    redirectTo: 'periodic-table',
    pathMatch: 'full'
  },

  // Ruta del Perfil del Estudiante y Reporte Académico
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile').then(m => m.ProfileComponent)
  },

  // Ruta del juego Misión Orgánica
  {
    path: 'mision-organica',
    loadComponent: () => import('./organic-mission/organic-mission').then(m => m.MisionOrganicaComponent)
  },

  {
    path: 'settings',
    loadComponent: () => import('./settings/settings').then(m => m.SettingsComponent)
  },

  // Ruta del Dashboard del Profesor (Gestión y Supervisión Docente)
  {
    path: 'teacher-dashboard',
    loadComponent: () => import('./teacher-dashboard/teacher-dashboard').then(m => m.TeacherDashboardComponent)
  },

  // Ruta del Centro de Ayuda y Soporte
  {
    path: 'help',
    loadComponent: () => import('./help/help').then(m => m.HelpComponent)
  },

  // Ruta para Challenges
  {
    path: 'challenges',
    loadComponent: () => import('./challenges/challenges').then(m => m.ChallengesComponent)
  },

  // Ruta de Bienvenida / Landing Page Principal
  {
    path: 'home',
    loadComponent: () => import('./home/home').then(m => m.HomeComponent)
  },

  // Redirección inicial por defecto a la página principal (Home)
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' }
];
