import { Routes } from '@angular/router';

export const routes: Routes = [
  // Ruta de Login (Pública / Autenticación)
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.LoginComponent)
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

  // Ruta de la Tabla Periódica (Dentro del Layout con Sidebar)
  {
    path: 'periodic-table',
    loadComponent: () => import('./periodic-table/periodic-table').then(m => m.PeriodicTableComponent)
  },
  {
    path: 'tabla-periodica',
    redirectTo: 'periodic-table',
    pathMatch: 'full'
  },

  // Redirecciones por defecto con las rutas existentes
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
