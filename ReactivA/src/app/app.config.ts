import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { AuthService, PROGRESS_SYNC_HANDLER } from './core/auth/auth.service';
import { StudentProgressService } from './dashboard/student-progress.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    { provide: PROGRESS_SYNC_HANDLER, useExisting: StudentProgressService },
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      return auth.restoreSession();
    })
  ]
};
