import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

import { ExerciseItem, AnswerPayload } from '../models';

// IMPORTA las clases EXACTAS exportadas por los hijos
import { DragToBucket } from '../drag-to-bucket/drag-to-bucket';
import { MatchPairs } from '../match-pairs/match-pairs';

@Component({
  selector: 'app-activity-renderer',
  standalone: true,
  imports: [CommonModule, MatCardModule, DragToBucket, MatchPairs],
  templateUrl: './activity-renderer.html',
  styleUrl: './activity-renderer.css'
})
export class ActivityRenderer {
  @Input({ required: true }) item!: ExerciseItem;
  @Output() answer = new EventEmitter<AnswerPayload>();

  get hasItem() {
    return !!this.item;
  }
  
  // para tipar correctamente el $event en la plantilla
  onChildAnswer(payload: AnswerPayload) {
    this.answer.emit(payload);
  }
}