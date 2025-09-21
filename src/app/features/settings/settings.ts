import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../shared/components/navbar/navbar';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { Auth } from '../../core/auth';
import { Router } from '@angular/router';
import { Theme } from '../../core/theme';

@Component({
  selector: 'app-settings',
  imports: [Navbar, ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class Settings {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);
  private theme = inject(Theme);

  tab: 'seguridad' | 'preferencias' = 'seguridad';
  msg = ''; err = ''; loading = false;

  // Estado de bloqueo y modal de desbloqueo
  locked = true;
  unlockModalOpen = false;

  me = this.auth.getCurrentUser();

  // Form principal de seguridad
  securityForm = this.fb.group({
    current: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(6)]],
    password: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(6)]],
    repeat:   [{ value: '', disabled: true }, [Validators.required, Validators.minLength(6)]],
  });

  // Form del overlay (solo pide la actual)
  unlockForm = this.fb.group({
    current: ['', [Validators.required, Validators.minLength(6)]],
  });

  // Preferencias (solo front)
  prefs = {
    theme: (localStorage.getItem('pref_theme') ?? 'light') as 'light' | 'dark'
  };

  setTab(t: typeof this.tab) { this.tab = t; this.clearMsgs(); }
  clearMsgs() { this.msg = ''; this.err = ''; }

  // ---------- Desbloqueo con overlay ----------
  openUnlock() {
    this.clearMsgs();
    this.unlockForm.reset();
    this.unlockModalOpen = true;
  }

  cancelUnlock() {
    this.unlockModalOpen = false;
  }

  confirmUnlock() {
    if (this.unlockForm.invalid) return;
    const current = this.unlockForm.value.current!;

    this.loading = true; this.err = ''; this.msg = '';
    this.auth.checkPassword(current).subscribe({
      next: () => {
        this.loading = false;
        // ok → desbloquear
        this.unlockModalOpen = false;
        this.locked = false;

        this.securityForm.controls.current.enable();
        this.securityForm.controls.password.enable();
        this.securityForm.controls.repeat.enable();
        this.securityForm.controls.current.setValue(current);
      },
      error: (e) => {
        this.loading = false;
        // Mantén el overlay abierto y muestra error
        this.err = e?.error?.detail ?? 'Contraseña actual incorrecta';

        //hacerlo desaparecer tras 3s
        setTimeout(() => { this.err = ''; }, 3000);
      }
    });
  }

  // Re-bloquear manualmente
  relock() {
    this.locked = true;
    this.securityForm.controls.current.disable();
    this.securityForm.controls.password.disable();
    this.securityForm.controls.repeat.disable();
    this.securityForm.reset({
      current: '',
      password: '',
      repeat: ''
    });
    this.clearMsgs();
  }

  // ---------- Cambiar contraseña ----------
  changePassword() {
    if (this.locked) return;
    if (this.securityForm.invalid) return;

    const { current, password, repeat } = this.securityForm.getRawValue();
    if (password !== repeat) { this.err = 'Las contraseñas no coinciden.'; return; }

    this.loading = true; this.clearMsgs();
    this.auth.changePassword(current!, password!).subscribe({
      next: () => {
        this.loading = false;
        this.msg = 'Contraseña actualizada.';
        // Re-bloquear automáticamente
        this.relock();
      },
      error: (e) => {
        this.loading = false;
        this.err = e?.error?.detail ?? 'No se pudo actualizar la contraseña.';
      }
    });
  }

  // ---------- Preferencias ----------
  savePrefs() {
    localStorage.setItem('pref_theme', this.prefs.theme);
    this.theme.setTheme(this.prefs.theme); // aplica global
    this.msg = 'Preferencias guardadas.';
  }
}
