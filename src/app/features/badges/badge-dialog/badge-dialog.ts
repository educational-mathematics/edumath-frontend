import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Badge } from '../../../core/models/badge.model';

@Component({
  selector: 'app-badge-dialog',
  imports: [CommonModule, MatDialogModule],
  templateUrl: './badge-dialog.html',
  styleUrl: './badge-dialog.css'
})
export class BadgeDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: Badge, private ref: MatDialogRef<BadgeDialog>){}
  onImgErr(ev: Event) {
  const img = ev.target as HTMLImageElement;
    img.onerror = null; // evita loop si falla el placeholder
    img.src = 'assets/badge-placeholder.png'; // asegúrate de tener este asset
  }
  close(){ this.ref.close(); }
}
