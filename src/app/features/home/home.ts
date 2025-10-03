import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Topics } from '../../core/topics';
import { Navbar } from '../../shared/components/navbar/navbar';
import { AddTopicDialog } from '../topics/add-topic-dialog/add-topic-dialog';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  imports: [Navbar, CommonModule, AddTopicDialog],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  private topics = inject(Topics);
  private router = inject(Router);
  readonly apiBase = environment.apiUrl;

  // --- reinicio desde TopicPlay ---
  restartSlug: string | null = null;
  restartTitle: string | null = null;
  showRestartConfirm = false;

  loaded = false;

  alreadyAddedIds: number[] = [];
  showAdd = false;
  items: any[] = [];

  ngOnInit() {
    // leer payload que pudo enviar TopicPlay
    const st = history.state as any;
    if (st?.restartSlug) {
      this.restartSlug = st.restartSlug;
      this.restartTitle = st.restartTitle;
      this.showRestartConfirm = true;
      // opcional: limpia el state del historial para evitar re-mostrar si refresca
      this.router.navigate([], { replaceUrl: true });
    }
    this.load();
  }

  load() {
    this.loaded = false;
    this.topics.myTopics().subscribe({
      next: list => {
        this.items = (list || []).map(t => ({
          ...t,
          // normaliza en front por si viene absoluta o relativa
          coverUrl: this.resolveImg(t.coverUrl)
        }));
        this.alreadyAddedIds = this.items.map(x => x.topicId);
        this.loaded = true;
      },
      error: _ => { this.items = []; this.alreadyAddedIds = []; this.loaded = true; }
    });
  }

  onOpenAdd() { this.showAdd = true; }
  onPickTopic(t: any) {
    this.showAdd = false;
    this.topics.addTopic(t.id).subscribe({
      next: _ => { this.showAdd = false; this.load(); },
      error: _ => { this.showAdd = false; }
    });
  }
  onCancelAdd() { this.showAdd = false; }

    resolveImg(u?: string | null): string | null {
    if (!u) return null;
    const s = u.trim();
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    if (s.startsWith('/media') || s.startsWith('/static')) return `${this.apiBase}${s}`;
    // por compatibilidad con seeds antiguas (covers/..., avatars/..., badges/...)
    if (s.startsWith('covers/') || s.startsWith('avatars/') || s.startsWith('badges/')) {
      return `${this.apiBase}/media/${s}`;
    }
    // último recurso: asume relativo a /media
    return `${this.apiBase}/media/${s.replace(/^\/+/, '')}`;
  }

  enter(t: any) {
    if (!t?.userTopicId) return;

    // Si el tema ya está completado, mostramos confirmación en Home
    if ((t.progressPct ?? 0) >= 100) {
      this.restartSlug = t.slug;
      this.restartTitle = t.title;
      this.showRestartConfirm = true;
      return;
    }

    // Si no está completado, entra directo
    this.router.navigate(['/topic', t.slug]);
  }

  // --- acciones modal reinicio ---
  confirmRestart() {
    if (!this.restartSlug) return;
    // Navega con reset=1 para forzar nueva sesión
    this.router.navigate(['/topic', this.restartSlug], { queryParams: { reset: 1 } });
    this.showRestartConfirm = false;
    this.restartSlug = null;
    this.restartTitle = null;
  }
  
  cancelRestart() {
    this.showRestartConfirm = false;
    this.restartSlug = null;
    this.restartTitle = null;
  }

  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    if ((img as any).__failedOnce) {
      // segunda vez: oculta para no spamear la consola
      img.style.visibility = 'hidden';
      return;
    }
    (img as any).__failedOnce = true;
    // si quieres fallback local, descomenta la línea de abajo y asegúrate de tener el asset
    // img.src = 'assets/cover-fallback.png';
    // si no quieres fallback, simplemente oculta:
    img.style.visibility = 'hidden';
  }
}
