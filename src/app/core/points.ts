import { Injectable, inject } from '@angular/core';
import { Api } from './api';
import { Toast } from './toast';
import { tap } from 'rxjs';

interface ChangePointsResp {
  ok: boolean;
  points: number;
  awardedBadges: Array<{
    id: number; slug: string; title: string; description: string;
    imageUrl: string; rarityPct: number; owned: boolean;
  }>;
}

@Injectable({ providedIn: 'root' })
export class PointsService {
  private api = inject(Api);
  private toast = inject(Toast);

  changeMyPoints(op: 'add' | 'set', value: number) {
    return this.api.post<ChangePointsResp>('/users/me/points', { op, value }).pipe(
      tap(resp => {
        for (const b of resp.awardedBadges || []) {
          this.toast.success(`¡Insignia obtenida! ${b.title}`, {
            imageUrl: this.api.absolute(b.imageUrl),
            timeoutMs: 4000,
          });
        }
        // Nota: el que refresca /me debe ser quien llama este método (por ej. Auth o el componente)
      })
    );
  }
}
