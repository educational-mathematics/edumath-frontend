import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { Topics } from '../../../core/topics';

@Component({
  selector: 'app-add-topic-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-topic-dialog.html',
  styleUrls: ['./add-topic-dialog.css']
})
export class AddTopicDialog {
  @Input() open = false;
  @Input() alreadyAddedIds: number[] = [];
  @Output() picked = new EventEmitter<any>();
  @Output() canceled = new EventEmitter<void>();

  readonly apiBase = environment.apiUrl;
  grades: number[] = [1,2,3,4,5,6]; // o lo que corresponda
  selGrade = 1;
  catalog: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

  private topics = inject(Topics);

  ngOnInit() {
    // carga catálogo si aún no está (ajústalo a tu servicio real)
    this.topics.catalog().subscribe(cat => {
      this.catalog = cat || {};
      // normaliza urls
      Object.keys(this.catalog).forEach(k => {
        this.catalog[+k] = (this.catalog[+k] || []).map(t => ({
          ...t,
          coverUrl: this.resolveImg(t.coverUrl)
        }));
      });
    });
  }

  resolveImg(u?: string | null): string | null {
    if (!u) return null;
    const s = u.trim();
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    if (s.startsWith('/media') || s.startsWith('/static')) return `${this.apiBase}${s}`;
    if (s.startsWith('covers/') || s.startsWith('avatars/') || s.startsWith('badges/')) {
      return `${this.apiBase}/media/${s}`;
    }
    return `${this.apiBase}/media/${s.replace(/^\/+/, '')}`;
  }

  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    if ((img as any).__failedOnce) {
      img.style.visibility = 'hidden';
      return;
    }
    (img as any).__failedOnce = true;
    // img.src = 'assets/cover-fallback.png'; // si quieres fallback local
    img.style.visibility = 'hidden';
  }

  isAdded(t: any) { return this.alreadyAddedIds?.includes(t.id); }
  pick(t: any) { if (!this.isAdded(t)) this.picked.emit(t); }
  close() { this.canceled.emit(); }
  stop(e: Event) { e.stopPropagation(); }
}
