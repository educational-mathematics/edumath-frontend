import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../shared/components/navbar/navbar';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { Auth } from '../../core/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  imports: [Navbar, ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css'] // <- usa plural
})
export class Settings {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  tab: 'seguridad' | 'preferencias' = 'seguridad';
  msg = '';
  err = '';
  loading = false;

  me = this.auth.getCurrentUser();

  // Seguridad
  securityForm = this.fb.group({
    current: ['', [Validators.required, Validators.minLength(6)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    repeat:   ['', [Validators.required, Validators.minLength(6)]],
  });

  // Preferencias (solo front)
  prefs = {
    theme: (localStorage.getItem('pref_theme') ?? 'light') as 'light' | 'dark'
  };

  setTab(t: typeof this.tab) { this.tab = t; this.clearMsgs(); }
  clearMsgs() { this.msg = ''; this.err = ''; }

  // ----- Seguridad -----
  changePassword() {
    if (this.securityForm.invalid) return;

    const { current, password, repeat } = this.securityForm.value;
    if (password !== repeat) {
      this.err = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true; this.clearMsgs();
    this.auth.changePassword(current!, password!).subscribe({
      next: () => {
        this.loading = false;
        this.msg = 'Contraseña actualizada.';
        this.securityForm.reset();
      },
      error: (e) => {
        this.loading = false;
        this.err = e?.error?.detail ?? 'No se pudo actualizar la contraseña.';
      }
    });
  }

  // ----- Preferencias -----
  savePrefs() {
    localStorage.setItem('pref_theme', this.prefs.theme);
    this.msg = 'Preferencias guardadas.';
  }
}