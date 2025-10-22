import { Component, computed, EventEmitter, Input, Output, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDropListGroup,
  CdkDropList,
  CdkDrag,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { DragToBucketItem, AnswerPayload } from '../models';

@Component({
  selector: 'drag-to-bucket',
  standalone: true,
  imports: [CommonModule, CdkDropListGroup, CdkDropList, CdkDrag, MatIconModule],
  templateUrl: './drag-to-bucket.html',
  styleUrl: './drag-to-bucket.css'
})
export class DragToBucket implements OnChanges {
  @Input({ required: true }) item!: DragToBucketItem;
  @Output() answerChange = new EventEmitter<AnswerPayload>();

  // estado
  safeTitle = signal<string>('');
  safeBuckets = signal<string[]>([]);
  pool = signal<string[]>([]);
  bucketMap = signal<Record<string, string[]>>({});

  // meta
  totalCount = signal(0);
  noItems = signal(false);

  // progreso: suma de elementos en todos los buckets
  placedCount = computed(() => {
    const map = this.bucketMap();
    return this.safeBuckets().reduce((n, b) => n + ((map[b]?.length ?? 0)), 0);
  });

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['item']) this.resetFromItem();
  }

  private resetFromItem(): void {
    const it = this.item ?? ({} as DragToBucketItem);

    // 1) Título y buckets (mínimo 2)
    this.safeTitle.set(String(it.title ?? '').trim());
    const buckets = Array.isArray(it.buckets) && it.buckets.length >= 2
      ? it.buckets.map(b => String(b ?? '').trim()).filter(Boolean)
      : ['Grupo A', 'Grupo B'];
    this.safeBuckets.set(buckets);

    // 2) Items: usa items; si no hay, usa unión de solution
    const fromSolution = Object.values(it.solution ?? {}).flatMap(x => (x || []) as string[]);
    let basePool = Array.isArray(it.items) && it.items.length > 0 ? [...it.items] : [...fromSolution];

    // 2.1) normaliza, dedup y baraja (GENÉRICO)
    const seen = new Set<string>();
    basePool = basePool
      .map(s => String(s ?? '').trim())
      .filter(s => s.length > 0 && (seen.has(s) ? false : seen.add(s)));
    basePool.sort(() => Math.random() - 0.5);

    // 3) buckets vacíos
    const map: Record<string, string[]> = {};
    for (const b of buckets) map[b] = [];

    // 4) estado
    this.pool.set(basePool);
    this.bucketMap.set(map);
    this.totalCount.set(basePool.length);
    this.noItems.set(basePool.length === 0);

    // emite estado inicial (incompleto)
    this.emitAnswer();
  }

  dropped(ev: CdkDragDrop<string[]>) {
    if (ev.previousContainer === ev.container) {
      moveItemInArray(ev.container.data, ev.previousIndex, ev.currentIndex);
    } else {
      transferArrayItem(ev.previousContainer.data, ev.container.data, ev.previousIndex, ev.currentIndex);
    }
    // fuerza reactividad
    this.pool.set([...this.pool()]);
    this.bucketMap.set({ ...this.bucketMap() });
  }

  // Utilidades opcionales
  moveAllToPool(): void {
    const map = { ...this.bucketMap() };
    for (const b of this.safeBuckets()) map[b] = [];
    this.bucketMap.set(map);
    this.emitAnswer();
  }

  submit(): void {
    this.emitAnswer();
  }

  private emitAnswer(): void {
    const norm = (s: string) => (s ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();

    const value: Record<string, string[]> = {};
    for (const b of this.safeBuckets()) {
      value[b] = (this.bucketMap()[b] ?? []).map(norm);
    }
    const isComplete = this.placedCount() >= this.totalCount() && this.totalCount() > 0;
    this.answerChange.emit({ value, isComplete });
  }
}
