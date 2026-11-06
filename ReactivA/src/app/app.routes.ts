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

  // Ruta del Perfil del Estudiante y Reporte Académico
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile').then(m => m.ProfileComponent)
  },

  // Redirecciones por defecto con las rutas existentes
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];