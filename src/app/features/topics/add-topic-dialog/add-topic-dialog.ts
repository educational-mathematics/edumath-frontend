import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Topics } from '../../../core/topics';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-add-topic-dialog',
  imports: [CommonModule],
  templateUrl: './add-topic-dialog.html',
  styleUrl: './add-topic-dialog.css'
})
export class AddTopicDialog {
  private topics = inject(Topics);

  readonly apiBase = environment.apiUrl;

  /** Controla visibilidad (el padre hace *ngIf para montarlo/desmontarlo). */
  @Input() open = false;

  /** Grado seleccionado por defecto */
  @Input() defaultGrade: 3 | 4 | 5 | 6 = 3;

  /** Catálogo remoto agrupado por grado {3:[{id,slug,title,coverUrl}], 4:[...],...} */
  catalog: Record<number, any[]> = {};
  grades: Array<3 | 4 | 5 | 6> = [3, 4, 5, 6];
  selGrade: 3 | 4 | 5 | 6 = 3;

  /** Emitir cuando el usuario selecciona un tema */
  @Output() picked = new EventEmitter<{ id: number; slug: string; title: string; coverUrl?: string }>();

  /** Emitir si cierra sin seleccionar */
  @Output() canceled = new EventEmitter<void>();

  ngOnInit() {
    this.selGrade = this.defaultGrade;
    this.topics.catalog().subscribe(c => (this.catalog = c || {}));
  }

  pick(t: any) {
    if (this.isAdded(t)) return;
    this.picked.emit(t);
  }
  close() {
    this.canceled.emit();
  }

  /** Evita que el click dentro del modal cierre el diálogo */
  stop(e: Event) {
    e.stopPropagation();
  }

  @Input() alreadyAddedIds: number[] = [];

  isAdded(t: any): boolean {
    return this.alreadyAddedIds?.includes(t.id); // t.id = topicId del catálogo
  }
}
