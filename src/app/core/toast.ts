import { Injectable, signal } from '@angular/core';

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

export interface ToastData {
  id: number;
  title: string;
  message?: string;
  imageUrl?: string;
  kind?: ToastKind;  // visual
  timeoutMs?: number; // default 3000
}

@Injectable({
  providedIn: 'root'
})
export class Toast {
  private seq = 0;
  toasts = signal<ToastData[]>([]);

  show(t: Omit<ToastData, 'id'>) {
    const toast: ToastData = {
      id: ++this.seq,
      kind: 'info',
      timeoutMs: 3000,
      ...t
    };
    this.toasts.update(list => [toast, ...list]);
    if (toast.timeoutMs! > 0) {
      setTimeout(() => this.dismiss(toast.id), toast.timeoutMs);
    }
  }

  dismiss(id: number) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  // helpers
  success(title: string, opts: Partial<ToastData> = {}) { this.show({ title, kind: 'success', ...opts }); }
  error(title: string, opts: Partial<ToastData> = {}) { this.show({ title, kind: 'error', ...opts }); }
  warning(title: string, opts: Partial<ToastData> = {}) { this.show({ title, kind: 'warning', ...opts }); }
  info(title: string, opts: Partial<ToastData> = {}) { this.show({ title, kind: 'info', ...opts }); }
}
