import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from '../models/user.model';

function isSafeInternalUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  // Debe empezar con '/' y no ser URL protocol-relative '//' ni con esquema 'http:' o 'javascript:'
  return url.startsWith('/') && !url.startsWith('//') && !url.includes(':');
}

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  const returnUrl = isSafeInternalUrl(state.url) ? state.url : undefined;
  return router.createUrlTree(['/login'], {
    queryParams: returnUrl ? { returnUrl } : undefined
  });
};

export const guestGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  const userRole = authService.role();
  const target = userRole === 'docente' ? '/teacher-dashboard' : '/dashboard';
  return router.createUrlTree([target]);
};

export function roleGuard(expectedRole: Role): CanActivateFn {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const platformId = inject(PLATFORM_ID);
    if (!isPlatformBrowser(platformId)) {
      return true;
    }

    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      const returnUrl = isSafeInternalUrl(state.url) ? state.url : undefined;
      return router.createUrlTree(['/login'], {
        queryParams: returnUrl ? { returnUrl } : undefined
      });
    }

    const userRole = authService.role();
    if (userRole === expectedRole) {
      return true;
    }

    // Si tiene otro rol, redirigir al inicio correspondiente a su rol
    const homeTarget = userRole === 'docente' ? '/teacher-dashboard' : '/dashboard';
    return router.createUrlTree([homeTarget]);
  };
}
