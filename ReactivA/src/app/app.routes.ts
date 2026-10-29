import { Routes } from '@angular/router';

export const routes: Routes = [
  // Ruta de Login (Pública)
  { 
    path: 'login', 
    loadComponent: () => import('./login/login').then(m => m.LoginComponent) 
  },

  // Rutas del Dashboard y Tabla Periódica
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) 
  },
  { 
    path: 'tabla-periodica', 
    loadComponent: () => import('./tabla-periodica/tabla-periodica').then(m => m.TablaPeriodicaComponent) 
  },

  // Redirecciones por defecto
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];