import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-loading-overlay',
  imports: [CommonModule],
  templateUrl: './loading-overlay.html',
  styleUrl: './loading-overlay.css'
})
export class LoadingOverlay implements OnInit, OnDestroy {

  @Input() show = false;
  @Input() imageUrl?: string;
  @Input() headline?: string;
  @Input() subline?: string;
  @Input() tips?: string[];
  @Input() tipIntervalMs = 4000;

  currentTip = '';
  private sub?: Subscription;
  private idx = 0;

  ngOnInit() {
    const list = (this.tips && this.tips.length) ? this.tips : [
      'Estoy preparando tus ejercicios…',
      'Afinando los números para que no se repitan…',
      'Generando imágenes para las fracciones…',
    ];
    this.currentTip = list[0];
    this.sub = interval(this.tipIntervalMs).subscribe(() => {
      let nextIdx;
      do {
        nextIdx = Math.floor(Math.random() * list.length);
      } while (nextIdx === this.idx && list.length > 1);
      this.idx = nextIdx;
      this.currentTip = list[this.idx];
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}
