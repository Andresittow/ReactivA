import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  registerForm!: FormGroup;

  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initForm();
  }

  // 1. Inicialización de FormGroup con FormBuilder y validaciones correspondientes (Clase 5b)
  private initForm(): void {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      role: ['estudiante', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      grade: ['', [Validators.required]],
      school: ['Colegio San Ignacio'],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
      newsletter: [false]
    }, { validators: this.passwordMatchValidator });
  }

  // 2. Validador personalizado a nivel de FormGroup para verificar coincidencia exacta de contraseñas (Clase 5b/5c)
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { mismatch: true };
  }

  // Getter auxiliar para obtener el rol actual seleccionado
  get selectedRole(): 'estudiante' | 'docente' {
    return this.registerForm.get('role')?.value ?? 'estudiante';
  }

  // Permite seleccionar el perfil y ajusta dinámicamente las validaciones del campo 'grade'
  setRole(role: 'estudiante' | 'docente'): void {
    this.registerForm.get('role')?.setValue(role);
    const gradeControl = this.registerForm.get('grade');

    if (role === 'estudiante') {
      gradeControl?.setValidators([Validators.required]);
    } else {
      gradeControl?.clearValidators();
    }
    gradeControl?.updateValueAndValidity();
  }

  // Alterna entre mostrar y ocultar la contraseña principal
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Alterna entre mostrar y ocultar la confirmación de contraseña
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // 3. Helper para consultar si un control es inválido y ya ha sido interactuado (touched o dirty)
  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  // Helper para verificar el error de contraseñas no coincidentes
  hasPasswordMismatch(): boolean {
    const confirmControl = this.registerForm.get('confirmPassword');
    return !!(this.registerForm.hasError('mismatch') && (confirmControl?.touched || confirmControl?.dirty));
  }

  // 4. Manejo del envío del formulario con validación previa
  onSubmit(): void {
    if (this.registerForm.valid) {
      // Redirección al Dashboard o al Login
      this.router.navigate([this.selectedRole === 'docente' ? '/teacher-dashboard' : '/dashboard']);
    } else {
      // Si el formulario es inválido, marcamos todos los controles como touched para disparar las validaciones visuales
      this.registerForm.markAllAsTouched();
    }
  }

  // Redirección al Login
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
