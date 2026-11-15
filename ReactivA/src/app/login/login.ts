import { ChangeDetectorRef, Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { accessError, pendingPin } from './access-feedback';
import { ClassroomService } from '../core/services/classroom.service';

function isSafeInternalUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/') && !url.startsWith('//') && !/[\\:%\s]/.test(url);
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly classroomService = inject(ClassroomService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly cdr = inject(ChangeDetectorRef);
  continuation: string | null = null;
  loginForm!: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage: string | null = null;
  infoMessage: string | null = null;

  // Estado del modal de recuperación de contraseña
  isResetModalOpen = false;
  resetEmail = '';
  isResetLoading = false;
  resetMessage: string | null = null;

  // Estado del flujo de PIN de Clase
  isPinModalOpen = false;
  pinValue = '';
  pinError: string | null = null;

  constructor() {
    this.loginForm = this.fb.group({
      role: ['estudiante', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });
  }

  get selectedRole(): 'estudiante' | 'docente' {
    return this.loginForm.get('role')?.value ?? 'estudiante';
  }

  setRole(role: 'estudiante' | 'docente'): void {
    this.loginForm.get('role')?.setValue(role);
    this.errorMessage = null;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  hasFieldError(field: string, errorKey: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.hasError(errorKey) && control.touched);
  }

  async onSubmit(): Promise<void> {
    if (this.isLoading || this.continuation) return;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.infoMessage = null;

    const { email, password, rememberMe, role } = this.loginForm.value;

    try {
      const profile = await this.authService.signIn({
        email: email.trim(),
        password,
        rememberMe: !!rememberMe,
        expectedRole: role
      });

      // Si hay un PIN pendiente en sessionStorage y el usuario es estudiante, canjearlo
      if (this.isBrowser && profile.role === 'estudiante') {
        const pin = pendingPin();
        if (pin) {
          pendingPin(null);
          try {
            await this.classroomService.joinByPin(pin);
          } catch {
            this.infoMessage = 'Iniciaste sesión, pero no pudimos canjear el PIN. Puedes continuar y volver a intentarlo desde tu aula.';
          }
        }
      }

      // Evaluar destino seguro con replaceUrl: true
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      let destination: string;

      if (isSafeInternalUrl(returnUrl) && this.canRoleAccess(profile.role, returnUrl!)) {
        destination = returnUrl!;
      } else {
        destination = this.authService.homeFor(profile.role);
      }

      if (this.infoMessage) this.continuation = destination;
      else await this.router.navigateByUrl(destination, { replaceUrl: true });
    } catch (err: any) {
      this.errorMessage = accessError(err);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  private canRoleAccess(role: 'estudiante' | 'docente', path: string): boolean {
    const root = path.split(/[/?#;]/)[1];
    const shared = ['settings', 'help'];
    const allowed = role === 'docente' ? ['teacher-dashboard', 'my-classrooms'] :
      ['dashboard', 'virtual-lab', 'periodic-table', 'tabla-periodica', 'mision-organica', 'challenges', 'profile'];
    return [...shared, ...allowed].includes(root);
  }

  async continueToHome(): Promise<void> {
    if (this.continuation) await this.router.navigateByUrl(this.continuation, { replaceUrl: true });
  }

  // ── Flujo: Recuperar contraseña ───────────────────────────
  openResetModal(): void {
    this.resetEmail = this.loginForm.get('email')?.value || '';
    this.resetMessage = null;
    this.isResetModalOpen = true;
  }

  closeResetModal(): void {
    this.isResetModalOpen = false;
    this.resetMessage = null;
  }

  async submitPasswordReset(): Promise<void> {
    if (this.isResetLoading) return;
    if (Validators.email({ value: this.resetEmail.trim() } as import('@angular/forms').AbstractControl) || !this.resetEmail.trim()) {
      this.resetMessage = 'Ingresa un correo electrónico válido.';
      return;
    }

    this.isResetLoading = true;
    this.resetMessage = null;

    try {
      await this.authService.requestPasswordReset(this.resetEmail.trim());
      this.resetMessage = 'Si el correo está registrado en ReactivA, te enviaremos instrucciones para restablecer tu contraseña.';
    } catch {
      this.resetMessage = 'Si el correo está registrado en ReactivA, te enviaremos instrucciones para restablecer tu contraseña.';
    } finally {
      this.isResetLoading = false;
      this.cdr.markForCheck();
    }
  }

  // ── Flujo: Ingresar PIN de Clase ──────────────────────────
  openPinModal(): void {
    this.pinValue = '';
    this.pinError = null;
    this.isPinModalOpen = true;
  }

  closePinModal(): void {
    this.isPinModalOpen = false;
    this.pinError = null;
  }

  savePendingPin(): void {
    const normalized = (this.pinValue || '').trim().toUpperCase();
    if (!/^CHEM-[0-9]{4}$/.test(normalized)) {
      this.pinError = 'El formato del PIN debe ser CHEM-XXXX (ej. CHEM-8420).';
      return;
    }

    if (this.isBrowser) {
      pendingPin(normalized);
    }
    this.closePinModal();
    this.infoMessage = `PIN ${normalized} guardado. Inicia sesión o regístrate como estudiante para ingresar directamente al aula.`;
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
