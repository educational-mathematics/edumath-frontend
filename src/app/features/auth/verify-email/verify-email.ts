import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Auth } from '../../../core/auth';
import { interval, takeWhile } from 'rxjs';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmail {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;
  message = '';
  cooldown = 0; // segundos para reenviar

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  ngOnInit() {
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    if (emailFromQuery) this.form.patchValue({ email: emailFromQuery });
  }

  private startCooldown(seconds = 120) {
    this.cooldown = seconds;
    interval(1000)
      .pipe(takeWhile(() => this.cooldown > 0))
      .subscribe(() => (this.cooldown -= 1));
  }

  resend() {
    if (this.form.controls.email.invalid) {
      this.message = 'Ingresa un correo válido.';
      return;
    }
    const email = this.form.value.email!;
    this.loading = true;
    this.auth.sendCode(email, 'register').subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Código reenviado. Revisa tu correo.';
        this.startCooldown(120);
      },
      error: () => {
        this.loading = false;
        this.message = 'No se pudo reenviar el código. Intenta de nuevo.';
      },
    });
  }

  verify() {
    if (this.form.invalid) return;
    this.loading = true;
    const { email, code } = this.form.value;
    this.auth.verifyCode(email!, code!, 'register').subscribe({
      next: () => {
        this.loading = false;
        this.message = '¡Verificación exitosa! Ahora puedes iniciar sesión.';
        setTimeout(() => this.router.navigate(['/login']), 1000);
      },
      error: (err) => {
        this.loading = false;
        this.message = err?.error?.detail ?? 'Código inválido o expirado.';
      },
    });
  }
}