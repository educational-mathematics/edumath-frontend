import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../shared/components/navbar/navbar';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { Auth } from '../../core/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [Navbar, ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class Settings implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  // stream del usuario (en lugar de snapshot)
  me$ = this.auth.user$;

  //tab: 'seguridad' | 'preferencias' = 'seguridad';
  tab: 'seguridad' = 'seguridad';
  msg = '';
  err = '';
  loading = false;

  // Seguridad
  locked = true;
  unlockModalOpen = false;

  ngOnInit(): void {
    this.syncLockState(); // bloqueado al inicio
  }

  private syncLockState() {
    if (this.locked) {
      this.securityForm.disable({ emitEvent: false });
    } else {
      this.securityForm.enable({ emitEvent: false });
    }
  }


  securityForm = this.fb.group({
    // current va en el modal, no en el form principal
    password: ['', [Validators.required, Validators.minLength(6)]],
    repeat:   ['', [Validators.required, Validators.minLength(6)]],
  });

  // Modal: contraseña actual para desbloquear
  unlockForm = this.fb.group({
    current: ['', [Validators.required, Validators.minLength(6)]],
  });

  // Preferencias (solo front)
  prefs = {
    theme: (localStorage.getItem('pref_theme') ?? 'light') as 'light' | 'dark'
  };

  setTab(t: typeof this.tab) { this.tab = t; this.clearMsgs(); }
  clearMsgs() { this.msg = ''; this.err = ''; }

  // ----- Desbloqueo -----
  openUnlock() { this.unlockModalOpen = true; this.clearMsgs(); }
  cancelUnlock() { this.unlockModalOpen = false; this.unlockForm.reset(); }
  async confirmUnlock() {
    if (this.unlockForm.invalid) return;
    this.loading = true; this.err = ''; this.msg = '';
    try {
      // valida contra backend la contraseña actual (sin cambiarla aún)
      await this.auth.checkPassword(this.unlockForm.value.current!).toPromise();
      this.unlockModalOpen = false;
      this.locked = false;
      this.syncLockState();
    } catch (e: any) {
      this.err = e?.error?.detail || 'Contraseña incorrecta.';
    } finally {
      this.loading = false;
    }
  }
  relock() {
    this.locked = true;
    this.securityForm.reset();
    this.syncLockState();
    this.clearMsgs();
  }

  // ----- Seguridad -----
  changePassword() {
    if (this.securityForm.invalid) return;
    const { password, repeat } = this.securityForm.value;
    if (password !== repeat) { this.err = 'Las contraseñas no coinciden.'; return; }

    // usamos la contraseña actual ingresada en el modal
    const current = this.unlockForm.value.current!;
    this.loading = true; this.clearMsgs();

    this.auth.changePassword(current, password!).subscribe({
      next: () => {
        this.loading = false;
        this.msg = 'Contraseña actualizada.';
        this.relock(); // vuelve a bloquear
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
    // aplica tema global si tienes servicio Theme con .setTheme(...)
    document.documentElement.dataset['theme'] = this.prefs.theme;
    this.msg = 'Preferencias guardadas.';
  }
}