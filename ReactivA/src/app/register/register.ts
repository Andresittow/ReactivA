import { ChangeDetectorRef, Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { accessError, pendingPin } from '../login/access-feedback';
import { ClassroomService } from '../core/services/classroom.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly classroomService = inject(ClassroomService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly cdr = inject(ChangeDetectorRef);
  infoMessage: string | null = null;
  continuation: string | null = null;
  registerForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage: string | null = null;
  needsEmailConfirmation = false;
  registeredEmail = '';

  constructor() {
    this.initForm();
  }

  private initForm(): void {
    // Si viene un PIN en sessionStorage, usarlo como valor inicial
    const initialPin = this.isBrowser ? pendingPin() : '';

    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3), (control: AbstractControl) => control.value?.trim().length >= 3 ? null : { minlength: true }, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      role: ['estudiante', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      grade: ['', [Validators.required]],
      school: ['', [Validators.required, Validators.minLength(3), (control: AbstractControl) => control.value?.trim().length >= 3 ? null : { minlength: true }]],
      classPin: [initialPin, [(control: AbstractControl) => !control.value || /^CHEM-[0-9]{4}$/.test(control.value.trim().toUpperCase()) ? null : { pattern: true }]],
      teacherInviteCode: [''],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
      newsletter: [false]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { mismatch: true };
  }

  get selectedRole(): 'estudiante' | 'docente' {
    return this.registerForm.get('role')?.value ?? 'estudiante';
  }

  setRole(role: 'estudiante' | 'docente'): void {
    this.registerForm.get('role')?.setValue(role);
    this.errorMessage = null;

    const gradeControl = this.registerForm.get('grade');
    const teacherCodeControl = this.registerForm.get('teacherInviteCode');
    const classPinControl = this.registerForm.get('classPin');

    if (role === 'estudiante') {
      gradeControl?.setValidators([Validators.required]);
      teacherCodeControl?.clearValidators();
      classPinControl?.setValidators([(control: AbstractControl) => !control.value || /^CHEM-[0-9]{4}$/.test(control.value.trim().toUpperCase()) ? null : { pattern: true }]);
    } else {
      gradeControl?.clearValidators();
      gradeControl?.setValue('');
      teacherCodeControl?.setValidators([Validators.required, Validators.minLength(4)]);
      classPinControl?.clearValidators();
      classPinControl?.setValue('');
    }

    gradeControl?.updateValueAndValidity();
    teacherCodeControl?.updateValueAndValidity();
    classPinControl?.updateValueAndValidity();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  hasPasswordMismatch(): boolean {
    const confirmControl = this.registerForm.get('confirmPassword');
    return !!(this.registerForm.hasError('mismatch') && (confirmControl?.touched || confirmControl?.dirty));
  }

  async onSubmit(): Promise<void> {
    if (this.isLoading || this.continuation) return;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const {
      fullName,
      email,
      password,
      role,
      grade,
      school,
      classPin,
      teacherInviteCode,
      newsletter
    } = this.registerForm.value;

    const cleanPin = (classPin || '').trim().toUpperCase();
    const cleanTeacherCode = (teacherInviteCode || '').trim();

    try {
      const result = await this.authService.signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
        grade: role === 'estudiante' ? grade?.trim() : undefined,
        school: school?.trim(),
        teacherInviteCode: role === 'docente' ? cleanTeacherCode : undefined,
        classPin: role === 'estudiante' && cleanPin ? cleanPin : undefined,
        newsletter: !!newsletter
      });

      this.registeredEmail = email.trim();
      if (role === 'estudiante' && cleanPin && this.isBrowser) pendingPin(cleanPin);

      if (result.needsEmailConfirmation) {
        // Pantalla informativa: no navegar al dashboard
        this.needsEmailConfirmation = true;
      } else {
        // Sesión iniciada inmediatamente
        if (role === 'estudiante' && cleanPin && this.isBrowser) {
          pendingPin(null);
          try {
            await this.classroomService.joinByPin(cleanPin);
          } catch {
            this.infoMessage = 'Tu cuenta está lista, pero no pudimos canjear el PIN. Puedes continuar y volver a intentarlo desde tu aula.';
          }
        }

        const destination = this.authService.homeFor(role);
        if (this.infoMessage) this.continuation = destination;
        else await this.router.navigateByUrl(destination, { replaceUrl: true });
      }
    } catch (err: any) {
      this.errorMessage = accessError(err, true);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  async continueToHome(): Promise<void> {
    if (this.continuation) await this.router.navigateByUrl(this.continuation, { replaceUrl: true });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
