import { Injectable, signal } from '@angular/core';

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

export interface ToastData {
  id: number;
  title: string;
  message?: string;
  imageUrl?: string;
  kind?: ToastKind;
  timeoutMs?: number;

  // NUEVO: identificador estable para dedupe (p. ej., slug de la insignia)
  badgeSlug?: string;
}

@Injectable({ providedIn: 'root' })
export class Toast {
  private seq = 0;
  toasts = signal<ToastData[]>([]);

  // Dedupe efímero (5s) por badgeSlug o fingerprint de contenido
  private recent = new Map<string, number>();
  private DEDUPE_TTL_MS = 5000;

  private now() { return Date.now(); }
  private gcRecent() {
    const t = this.now();
    for (const [k, ts] of this.recent.entries()) if (t - ts > this.DEDUPE_TTL_MS) this.recent.delete(k);
  }

  private normalizeImg(u?: string) {
    if (!u) return '';
    try {
      // quita host y query para que /media/… y absoluto sean equivalentes
      const url = new URL(u, window.location.origin);
      return (url.pathname || '').toLowerCase();
    } catch {
      // si es relativa tipo "/media/…" o "media/…"
      return u.replace(/^https?:\/\/[^/]+/i,'').split('?')[0].toLowerCase();
    }
  }

  private fingerprint(t: Omit<ToastData, 'id'>): string {
    // Si viene badgeSlug, usamos eso como clave primaria
    if (t.badgeSlug) return `badge:${t.badgeSlug.toLowerCase()}`;

    // fallback por contenido visible (menos sensible a diferencias)
    return JSON.stringify({
      k: t.kind || 'info',
      title: (t.title || '').trim().toLowerCase(),
      // ignora message para que un toast con/ sin descripción no duplique
      img: this.normalizeImg(t.imageUrl || '')
    });
  }

  show(t: Omit<ToastData, 'id'>) {
    this.gcRecent();
    const key = this.fingerprint(t);
    if (this.recent.has(key)) return;            // ← bloquea duplicados
    this.recent.set(key, this.now());

    const toast: ToastData = { id: ++this.seq, kind: 'info', timeoutMs: 3000, ...t };
    this.toasts.update(list => [toast, ...list]);
    if (toast.timeoutMs! > 0) setTimeout(() => this.dismiss(toast.id), toast.timeoutMs);
  }

  dismiss(id: number) { this.toasts.update(list => list.filter(t => t.id !== id)); }
  success(title: string, opts: Partial<ToastData> = {}) { this.show({ title, kind: 'success', ...opts }); }
  error(title: string, opts: Partial<ToastData> = {}) { this.show({ title, kind: 'error', ...opts }); }
  warning(title: string, opts: Partial<ToastData> = {}) { this.show({ title, kind: 'warning', ...opts }); }
  info(title: string, opts: Partial<ToastData> = {}) { this.show({ title, kind: 'info', ...opts }); }
}
