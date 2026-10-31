import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;

  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    // Formulario Reactivo fiel a la imagen de referencia
    this.registerForm = this.fb.group({
      role: ['estudiante', [Validators.required]],
      fullName: ['Camila Morales', [Validators.required, Validators.minLength(3)]],
      email: ['c.morales@colegio.edu', [Validators.required, Validators.email]],
      grade: ['10° Grado / Química General', [Validators.required]],
      school: ['Colegio San Ignacio', [Validators.required]],
      password: ['Quimica2026*!', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['Quimica2026*!', [Validators.required]],
      acceptTerms: [true, [Validators.requiredTrue]],
      newsletter: [true]
    }, { validators: this.passwordMatchValidator });
  }

  // Validador personalizado para confirmación de contraseña
  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirm = g.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  // Getter para el rol seleccionado actualmente
  get selectedRole(): 'estudiante' | 'docente' {
    return this.registerForm.get('role')?.value ?? 'estudiante';
  }

  // Selección de perfil educativo
  setRole(role: 'estudiante' | 'docente'): void {
    this.registerForm.get('role')?.setValue(role);
  }

  // Alternar visibilidad de contraseña
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Alternar visibilidad de confirmación de contraseña
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Helper para validación visual de campos
  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  // Envío del registro
  onSubmit(): void {
    if (this.registerForm.valid) {
      console.log('Registro exitoso en ReactivA:', this.registerForm.value);
      this.router.navigate(['/dashboard']);
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  // Redirección al componente de Login
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}

