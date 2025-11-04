import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { Topics } from '../../../core/topics';
import { Api } from '../../../core/api';

@Component({
  selector: 'app-add-topic-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-topic-dialog.html',
  styleUrls: ['./add-topic-dialog.css']
})
export class AddTopicDialog {
  @Input() open = false;
  @Input() alreadyAddedIds: number[] = [];
  @Output() picked = new EventEmitter<any>();
  @Output() canceled = new EventEmitter<void>()
  
  private api = inject(Api);
  private topics = inject(Topics);

  readonly apiBase = environment.apiUrl;
  grades: number[] = [3,4,5,6];
  selGrade = 3;
  catalog: Record<number, any[]> = { 3: [], 4: [], 5: [], 6: [] };

  ngOnInit() {
    this.topics.catalog().subscribe(cat => {
      this.catalog = cat || {};
    });
  }

  imgSrc(u?: string | null): string {
    return this.api.absolute(u || '') || 'assets/cover-fallback.png';
  }

  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.onerror = null;
    img.src = 'assets/cover-fallback.png';
  }

  isAdded(t: any) { return this.alreadyAddedIds?.includes(t.id); }
  pick(t: any) { if (!this.isAdded(t)) this.picked.emit(t); }
  close() { this.canceled.emit(); }
  stop(e: Event) { e.stopPropagation(); }
}
