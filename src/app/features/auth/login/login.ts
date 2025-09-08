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
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  showNotification = false;
  notificationMessage = '';
  loginAttempted = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    this.loginAttempted = true;
    if (this.loginForm.invalid) {
      this.showError('Campos incompletos');
      return;
    }

    const { email, password } = this.loginForm.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showError('Formato de correo inválido');
      return;
    }

    this.loading = true;
    this.authService.login({ email, password }).subscribe(user => {
      this.loading = false;

      // El servicio devuelve null si 401/403/etc.
      if (!user) {
        // Puede ser credenciales incorrectas (401) o correo no verificado (403)
        this.showError('Credenciales incorrectas o correo no verificado.');
        return;
      }

      // Ya hay token en localStorage y user guardado por el servicio
      // Navegación según firstLoginDone
      if (!user.firstLoginDone) {
        this.router.navigate(['/welcome']);
      } else {
        this.router.navigate(['/home']);
      }
    });
  }

  isInvalid(controlName: string) {
    const control = this.loginForm.get(controlName);
    return control?.invalid && this.loginAttempted;
  }

  showError(message: string) {
    this.notificationMessage = message;
    this.showNotification = true;
    setTimeout(() => (this.showNotification = false), 3000);
  }

  closeNotification() {
    this.showNotification = false;
  }
}