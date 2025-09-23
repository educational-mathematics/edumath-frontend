import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast } from '../../core/toast';

@Component({
  selector: 'app-toast-container',
  imports: [CommonModule],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css'
})
export class ToastContainer {
  ts = inject(Toast);
  toasts = computed(() => this.ts.toasts());
  dismiss = (id: number) => this.ts.dismiss(id);

  kindClass(k?: string) {
    return {
      'k-info': k === 'info' || !k,
      'k-success': k === 'success',
      'k-warning': k === 'warning',
      'k-error': k === 'error',
    };
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.style.display = 'none';
    }
  }
// .
}
