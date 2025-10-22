import { Component, EventEmitter, Input, Output, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDrag,
  CdkDropList,
  CdkDropListGroup,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatchPairsItem, AnswerPayload } from '../models';

@Component({
  selector: 'match-pairs',
  standalone: true,
  imports: [CommonModule, CdkDrag, CdkDropList, CdkDropListGroup, MatIconModule],
  templateUrl: './match-pairs.html',
  styleUrl: './match-pairs.css'
})
export class MatchPairs implements OnChanges{
  @Input() item!: MatchPairsItem;
  @Output() answerChange = new EventEmitter<AnswerPayload>();

  left = signal<string[]>([]);
  right = signal<string[]>([]);
  private originalLen = 0;

  ngOnChanges(ch: SimpleChanges) {
    if (!ch['item']) return;
    const pairs = (this.item?.pairs || []).filter(p => Array.isArray(p) && p.length === 2);
    const L = pairs.map(p => String(p[0]));
    const R = pairs.map(p => String(p[1]));
    R.sort(() => Math.random() - 0.5);

    this.left.set(L);
    this.right.set(R);
    this.originalLen = Math.min(L.length, R.length);
  }

  dropped(event: CdkDragDrop<string[]>, side: 'left' | 'right') {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
    if (side === 'left') this.left.set([...this.left()]);
    else this.right.set([...this.right()]);
  }

  submit() {
    const L = this.left(); const R = this.right();
    const n = Math.min(L.length, R.length);
    const out: [string, string][] = [];
    for (let i = 0; i < n; i++) out.push([L[i], R[i]]);
    const complete = n >= this.originalLen && this.originalLen > 0;
    this.answerChange.emit({ value: out, isComplete: complete });
  }
}
