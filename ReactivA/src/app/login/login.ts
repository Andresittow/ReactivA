import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router'; // 1. Importamos el Router

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  selectedRole: 'estudiante' | 'docente' = 'estudiante';
  showPassword = false;

  // 2. Inyectamos el Router en el constructor
  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });
  }

  setRole(role: 'estudiante' | 'docente'): void {
    this.selectedRole = role;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log('Datos de inicio de sesión (ReactivA):', {
        role: this.selectedRole,
        ...this.loginForm.value
      });

      // 3. Redirigimos al Dashboard tras un inicio de sesión válido
      this.router.navigate(['/dashboard']);
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}