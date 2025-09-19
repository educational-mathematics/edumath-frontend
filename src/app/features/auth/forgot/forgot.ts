import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../../core/auth';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-forgot',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, RouterModule],
  templateUrl: './forgot.html',
  styleUrl: './forgot.css',
})
export class Forgot {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  loading = false;
  message = '';
  step: 1 | 2 = 1;
  email = '';

  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  resetForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  sendCode() {
    if (this.emailForm.invalid) return;
    this.loading = true;
    this.email = this.emailForm.value.email!;
    this.auth.forgot(this.email).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Código enviado. Revisa tu correo.';
        this.step = 2;
      },
      error: () => {
        this.loading = false;
        this.message = 'No se pudo enviar el código. Intenta de nuevo.';
      },
    });
  }

  reset() {
    if (this.resetForm.invalid) return;
    this.loading = true;
    const code = this.resetForm.value.code!;
    const pwd = this.resetForm.value.password!;
    this.auth.reset(this.email, code, pwd).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Contraseña actualizada. Redirigiendo al login...';
        setTimeout(() => this.router.navigate(['/login']), 1200);
      },
      error: (err) => {
        this.loading = false;
        this.message = err?.error?.detail ?? 'Código inválido o expirado.';
      },
    });
  }
}