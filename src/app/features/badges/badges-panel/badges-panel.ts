import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Badge } from '../../../core/models/badge.model';
import { Badges } from '../../../core/badges';
import { BadgeDialog } from '../badge-dialog/badge-dialog';

@Component({
  selector: 'app-badges-panel',
  imports: [CommonModule, MatDialogModule],
  templateUrl: './badges-panel.html',
  styleUrl: './badges-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgesPanel {
  private badgesSvc = inject(Badges);
  private dialog = inject(MatDialog);

  badges = signal<Badge[]>([]);
  showAll = signal(false);

  constructor() {
    this.badgesSvc.list().subscribe(list => this.badges.set(list));
  }

  visibleBadges = signal<Badge[]>([]);
  private recompute = effect(() => {
    const all = this.badges();
    const slice = this.showAll() ? all : all.slice(0, 7); 
    this.visibleBadges.set(slice);
  });

  toggleShowAll(){ this.showAll.update(v => !v); }

  onImgErr(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.onerror = null;
    img.src = 'assets/badge-placeholder.png';
  }

  open(b: Badge){
    this.dialog.open(BadgeDialog, { data: b, autoFocus: false, restoreFocus: false });
  }
}
