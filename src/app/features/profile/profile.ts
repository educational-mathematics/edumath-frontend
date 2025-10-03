import { Component, inject, ViewChild, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { Auth } from '../../core/auth';
import { Navbar } from '../../shared/components/navbar/navbar';
import { RankingRow } from '../../core/models/ranking.model';
import { BadgesPanel } from '../badges/badges-panel/badges-panel';
import { Toast } from '../../core/toast';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [Navbar, CommonModule, ReactiveFormsModule, BadgesPanel],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  readonly apiBase = environment.apiUrl;

  // Stream del usuario
  me$ = this.auth.user$;
  private sub?: Subscription;
  private lastAlias: string | undefined;
  private lastName: string | undefined;

  private toast = inject(Toast);
  private shownKingToast = false; // evita repetir el toast en esta sesión de la vista

  msg = ''; err = ''; loading = false;

  // estados de edición
  editingName = false;
  editingAlias = false;

  // ranking
  ranking: RankingRow[] = [];
  top100: RankingRow[] = [];
  myOutside: RankingRow | null = null;

  // preview de avatar
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  avatarPreview: string | null = null;

  profileForm = this.fb.group({
    name: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(2)]],
    avatarUrl: [''],
  });

  aliasForm = this.fb.group({
    alias: [{ value: '', disabled: true }, [Validators.minLength(3), Validators.maxLength(32)]],
  });

    // Devuelve una URL lista para <img>, con apiBase si viene relativa (/media/…)
  private buildImgSrc(u?: string | null): string | null {
    if (!u) return null;
    const url = u.trim();
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // Relativa servida por backend
    if (url.startsWith('/media/') || url.startsWith('/static/')) {
      return this.apiBase + url;
    }
    // Último recurso: trátala como relativa de /media
    return this.apiBase + '/media/' + url.replace(/^\/+/, '');
  }

  // === AVATAR PRINCIPAL (se muestra en la tarjeta izquierda) ===
  avatarSrc(me: any): string {
    if (this.avatarPreview) return this.avatarPreview; // preview al subir
    const u = (me?.avatarUrl || me?.avatar_url || '').trim();
    const built = this.buildImgSrc(u);
    return built || 'assets/avatar-placeholder.png';
  }

  // === AVATARES DEL RANKING (usa snake_case que viene del backend) ===
  rankAvatarSrc(u?: string | null): string {
    const built = this.buildImgSrc(u);
    return built || 'assets/avatar-placeholder.png';
  }

  ngOnInit() {
    // Suscríbete al usuario para parchear formularios y cargar ranking al tener alias
    this.sub = this.me$.subscribe(me => {
      if (!me) return;

      // Guarda snapshot básico
      this.lastAlias = me.alias ?? undefined;
      this.lastName = me.name ?? '';

      // Parchea formularios sin marcar touched
      this.profileForm.patchValue(
        { name: me.name ?? '', avatarUrl: me.avatarUrl ?? '' },
        { emitEvent: false }
      );
      this.aliasForm.patchValue(
        { alias: me.alias ?? '' },
        { emitEvent: false }
      );

      // Si el alias aparece (o cambia), recarga ranking
      if (me.alias) {
        this.loadRanking();
      } else {
        // Si no hay alias, limpia ranking
        this.ranking = [];
        this.top100 = [];
        this.myOutside = null;
      }
    });

    // Forzar refresco al abrir la vista para que me?.points esté al día
    this.auth.refreshMe().subscribe({
      error: () => {} // silencioso
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  // ------ Perfil ------
  startEditName() {
    this.editingName = true;
    this.profileForm.controls.name.enable();
    this.msg=''; this.err='';
  }
  async cancelEditName() {
    this.editingName = false;
    this.profileForm.controls.name.disable();
    // Reset al valor actual del stream (por si el usuario tecleó y canceló)
    const me = await firstValueFrom(this.me$);
    this.profileForm.controls.name.setValue(me?.name ?? '');
  }
  saveProfile() {
    if (this.profileForm.invalid) return;
    const name = (this.profileForm.value.name || '').toString().trim();
    if (!name) return;

    this.loading = true; this.msg=''; this.err='';
    this.auth.updateUser({ name }).subscribe({
      next: () => {
        this.loading = false;
        this.msg = 'Nombre actualizado.';
        this.cancelEditName();
      },
      error: () => { this.loading = false; this.err = 'No se pudo actualizar el perfil.'; }
    });
    //desaparecer alerta
    setTimeout(() => {
      this.msg = '';
      this.err = '';
    }, 3000);
  }

  // Avatar
  pickFile() { this.fileInput?.nativeElement.click(); }

  // Tras subir, fuerza refresh y rompe caché
  onFileChange(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.avatarPreview = URL.createObjectURL(file);
    this.loading = true; this.msg=''; this.err='';

    this.auth.uploadAvatar(file).subscribe({
      next: () => {
        this.loading = false;
        this.msg = 'Foto actualizada.';
        this.avatarPreview = null;
        input.value = '';
        // Refresca /users/me para obtener la nueva ruta /media/avatars/...
        this.auth.refreshMe().subscribe({
          next: () => {
            // nada: el async pipe se actualiza solo
          },
          error: () => {}
        });
      },
      error: (e) => {
        this.loading = false;
        this.err = e?.error?.detail ?? 'No se pudo subir la foto.';
        this.avatarPreview = null;
        input.value = '';
      }
    });

    setTimeout(() => { this.msg = ''; this.err = ''; }, 3000);
  }

  // ------ Alias / Ranking ------
  startEditAlias() {
    this.editingAlias = true;
    this.aliasForm.controls.alias.enable();
    this.msg=''; this.err='';
  }
  async cancelEditAlias() {
    this.editingAlias = false;
    this.aliasForm.controls.alias.disable();
    // Reset al valor actual del stream
    const me = await firstValueFrom(this.me$);
    this.aliasForm.controls.alias.setValue(me?.alias ?? '');
  }
  saveAlias() {
    const alias = (this.aliasForm.getRawValue().alias || '').toString().trim();
    if (!alias) { this.err = 'El alias no puede estar vacío.'; return; }
    this.loading = true; this.msg=''; this.err='';
    this.auth.setAlias(alias).subscribe({
      next: () => {
        this.loading = false;
        this.msg = 'Alias actualizado.';
        this.cancelEditAlias();
        // user$ disparará loadRanking si hace falta
      },
      error: (e) => {
        this.loading = false;
        this.err = (e?.status === 409) ? 'Ese alias ya está en uso.' : (e?.error?.detail || 'No se pudo actualizar el alias.');
      }
    });

    //desaparecer alerta
    setTimeout(() => {
      this.msg = '';
      this.err = '';
    }, 3000);
  }

  loadRanking() {
    const myAlias = this.lastAlias;

    this.auth.getRanking().subscribe({
      next: (rows) => {
        this.ranking = rows || [];
        this.top100 = this.ranking.slice(0, 100);

        // ¿Estoy en el Top 100?
        const inTop = myAlias ? this.top100.find(r => r.alias === myAlias) : null;

        if (inTop) {
          // no muestres “fuera del top”
          this.myOutside = null;

          // Si soy rank 1 y tengo > 1000 pts → toast (una sola vez)
          if (!this.shownKingToast && inTop.rank === 1 && (inTop.points ?? 0) > 1000) {
            this.toast.success('¡Insignia obtenida: El Rey!', {
              message: 'Has alcanzado el TOP 1 con más de 1000 puntos',
              imageUrl: this.apiBase + '/media/badges/king.png',
              timeoutMs: 3000,
            });
            this.shownKingToast = true;

            // refresca user para que las insignias queden actualizadas en Auth (silencioso)
            this.auth.refreshMe().subscribe({ error: () => {} });
          }
          return;
        }

        // Si no hay alias, limpia y sal
        if (!myAlias) {
          this.myOutside = null;
          return;
        }

        // Fuera del Top 100: consulta tu fila real
        this.auth.getMyRank().subscribe({
          next: (meRow) => {
            if (meRow && meRow.rank && meRow.rank > 100) this.myOutside = meRow;
            else this.myOutside = null;
          },
          error: () => { this.myOutside = null; }
        });
      },
      error: () => {
        this.ranking = [];
        this.top100 = [];
        this.myOutside = null;
      }
    });
  }
  
  onImgError(ev: Event) {
    (ev.target as HTMLImageElement).src = 'assets/avatar-placeholder.png';
  }
}