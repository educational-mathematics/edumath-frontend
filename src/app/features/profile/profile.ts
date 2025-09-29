import { Component, inject, ViewChild, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { Auth } from '../../core/auth';
import { Navbar } from '../../shared/components/navbar/navbar';
import { RankingRow } from '../../core/models/ranking.model'; // 👈 crea este interface { rank, alias, points, avatar_url? }
import { BadgesPanel } from '../badges/badges-panel/badges-panel';
import { Toast } from '../../core/toast';

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

  onFileChange(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // preview optimista
    const url = URL.createObjectURL(file);
    this.avatarPreview = url;

    this.loading = true; this.msg=''; this.err='';
    this.auth.uploadAvatar(file).subscribe({
      next: () => {
        this.loading = false;
        this.msg = 'Foto actualizada.';
        this.avatarPreview = null;
        input.value = '';
      },
      error: (e) => {
        this.loading = false;
        this.err = e?.error?.detail ?? 'No se pudo subir la foto.';
        this.avatarPreview = null;
        input.value = '';
      }
    });
    //desaparecer alerta
    setTimeout(() => {
      this.msg = '';
      this.err = '';
    }, 3000);
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

          // 👑 Si soy rank 1 y tengo > 1000 pts → toast (una sola vez)
          if (!this.shownKingToast && inTop.rank === 1 && (inTop.points ?? 0) > 1000) {
            this.toast.success('¡Insignia obtenida: El Rey!', {
              message: 'Has alcanzado el TOP 1 con más de 1000 puntos',
              imageUrl: '/static/badges/king.png',
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

            // Si soy rank 1 y tengo > 1000 pts → toast (una sola vez)
            //if (!this.shownKingToast && meRow && meRow.rank === 1 && (meRow.points ?? 0) > 1000) {
              //this.toast.success('¡Insignia obtenida: El Rey!', {
                //message: 'Has alcanzado el TOP 1 con más de 1000 puntos',
                //imageUrl: 'assets/king.png',
                //timeoutMs: 3000,
              //});
              //this.shownKingToast = true;
              //this.auth.refreshMe().subscribe({ error: () => {} });
            //}
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

  avatarSrc(me: any): string {
    if (this.avatarPreview) return this.avatarPreview;
    const u = (me?.avatarUrl || '').trim();
    return u || 'assets/avatar-placeholder.png';
  }

  onImgError(ev: Event) {
    (ev.target as HTMLImageElement).src = 'assets/avatar-placeholder.png';
  }
}