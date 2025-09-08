import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Auth } from '../../../core/auth';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  registerForm: FormGroup;
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'error';
  registerAttempted = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    this.registerAttempted = true;
    if (this.registerForm.invalid) {
      this.showError('Por favor, completa todos los campos correctamente');
      return;
    }

    const { name, email, password } = this.registerForm.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showError('Formato de correo inválido');
      return;
    }

    this.loading = true;
    this.authService.register({ name, email, password }).subscribe({
      next: () => {
        this.loading = false;
        // El backend ya envió un código a tu correo
        this.showSuccess('Registro exitoso. Revisa tu correo para verificar tu cuenta.');
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (error) => {
        this.loading = false;
        if (error?.status === 409) {
          this.showError('Este correo electrónico ya está registrado');
        } else {
          this.showError('Error en el registro. Inténtalo de nuevo');
        }
      }
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!(control?.invalid && this.registerAttempted);
  }

  showError(message: string) {
    this.notificationMessage = message;
    this.notificationType = 'error';
    this.showNotification = true;
    setTimeout(() => (this.showNotification = false), 4000);
  }

  showSuccess(message: string) {
    this.notificationMessage = message;
    this.notificationType = 'success';
    this.showNotification = true;
    setTimeout(() => (this.showNotification = false), 4000);
  }

  closeNotification() {
    this.showNotification = false;
  }
}