import { Injectable, inject } from '@angular/core';
import { Toast } from './toast';
import { Api } from './api';

type Award = { slug: string; title: string; imageUrl?: string; description?: string };

@Injectable({ providedIn: 'root' })
export class BadgeToastGuard {
  private toast = inject(Toast);
  private api = inject(Api);

  // dedupe en memoria (turno actual)
  private inFlight = new Set<string>(); // key: `${userId}:${slug}`
  private inFlightByTitle = new Set<string>(); // `${userId}:${title.toLowerCase()}`

  private storageKey(userId: number, slug: string) {
    return `badges.seen.${userId}.${slug}`;
  }

  private alreadyShown(userId: number, slug: string): boolean {
    const key = this.storageKey(userId, slug);
    try { return localStorage.getItem(key) === '1'; } catch { return false; }
  }
  private markShown(userId: number, slug: string) {
    const key = this.storageKey(userId, slug);
    try { localStorage.setItem(key, '1'); } catch {}
  }

  showNewForUser(userId: number, awards: Award[]) {
    if (!userId || !Array.isArray(awards)) return;

    for (const raw of awards) {
      const slug = (raw.slug ?? '').trim().toLowerCase();     // ← normaliza
      const title = (raw.title ?? '').trim();
      const titleKey = `${userId}:${title.toLowerCase()}`;

      // Filtro fuerte por título si no hay slug
      if (!slug && (!title || this.inFlightByTitle.has(titleKey))) continue;

      // Dedupe almacenamiento + memoria por slug (si existe)
      if (slug) {
        const k = `${userId}:${slug}`;
        if (this.inFlight.has(k)) continue;
        if (this.alreadyShown(userId, slug)) continue;

        this.inFlight.add(k);
        this.markShown(userId, slug);
        setTimeout(() => this.inFlight.delete(k), 5000);
      } else {
        // Sin slug → usa título como segunda línea de defensa
        this.inFlightByTitle.add(titleKey);
        setTimeout(() => this.inFlightByTitle.delete(titleKey), 5000);
      }

      // Un solo formato de toast
      this.toast.success(`¡Insignia obtenida: ${title}!`, {
        imageUrl: this.api.absolute?.(raw.imageUrl) ?? raw.imageUrl,
        timeoutMs: 4000
      });
    }
  }
}