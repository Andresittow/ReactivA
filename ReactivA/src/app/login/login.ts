import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    // 1. Inicialización de FormGroup con FormBuilder y validaciones estrictas
    this.loginForm = this.fb.group({
      role: ['estudiante', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  // Getter auxiliar para obtener el rol actual seleccionado
  get selectedRole(): 'estudiante' | 'docente' {
    return this.loginForm.get('role')?.value ?? 'estudiante';
  }

  // Actualiza el valor del control 'role' en el formulario reactivo
  setRole(role: 'estudiante' | 'docente'): void {
    this.loginForm.get('role')?.setValue(role);
  }

  // Alterna entre mostrar y ocultar la contraseña
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Método helper para verificar si un campo es inválido y ya ha sido interactuado (touched)
  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  // Método helper para verificar un error específico en un control
  hasFieldError(field: string, errorKey: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.hasError(errorKey) && control.touched);
  }

  // Manejo del envío del formulario
  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log('Formulario válido. Datos de autenticación (ReactivA):', this.loginForm.value);

      // Redirección al Dashboard
      this.router.navigate(['/dashboard']);
    } else {
      // Dispara la activación visual de todos los errores marcando los campos como tocados
      this.loginForm.markAllAsTouched();
    }
  }
}
