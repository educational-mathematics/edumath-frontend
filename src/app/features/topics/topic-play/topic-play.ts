import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Topics } from '../../../core/topics';
import { firstValueFrom } from 'rxjs';

type VAK = 'visual'|'auditivo'|'kinestesico';

@Component({
  selector: 'app-topic-play',
  imports: [CommonModule, FormsModule],
  templateUrl: './topic-play.html',
  styleUrl: './topic-play.css'
})
export class TopicPlay {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private topics = inject(Topics);

  userTopicId!: number;
  sessionId!: number;

  title = '';
  style: VAK = 'visual';
  explanation: string | null = null;
  ttsUrl: string | null = null;

  items: any[] = [];
  currentIndex = 0;
  item: any;

  // respuestas en UI
  mcqAnswer: number | null = null;
  lefts: string[] = [];
  rights: string[] = [];
  pairAnswer: string[] = [];
  bucketAnswer: Record<string, Set<string>> = {};

  bucketOf: Record<string, string> = {}; // { item -> bucket }
  buckets: string[] = [];
  itemsForBuckets: string[] = [];
  bucketChoice: Record<string, string> = {};

  feedback: string | null = null;
  lastCorrect: boolean | null = null;

  // timer
  elapsedSec = 0;
  private ticker: any;

  progressPct = 0;
  
  ready = false;

  showFinish = false;
  finishStats: { timeSec: number; mistakes: number; precisionPct: number } | null = null;

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.topics.openBySlug(slug).subscribe(res => {
      if (res.alreadyCompleted) {
        const ok = confirm('Ya completaste este tema. ¿Quieres reiniciarlo?');
        if (!ok) { this.router.navigateByUrl('/home'); return; }
        // reintenta abriendo con reset=1
        this.topics.openBySlug(slug, true).subscribe(r2 => this._load(r2));
      } else {
        this._load(res);
      }
    });
  }

  ngOnDestroy() { if (this.ticker) clearInterval(this.ticker); }
  startTimer() { this.ticker = setInterval(() => this.elapsedSec++, 1000); }

  private _load(res: any) {
    this.sessionId = res.sessionId;
    this.title = res.title;
    this.style = res.style;
    this.explanation = res.explanation || null;
    this.items = res.items || [];
    this.currentIndex = res.currentIndex || 0;
    this.item = this.items[this.currentIndex] || null;

    this.ttsUrl = res.explanationAudioUrl || null;

    if (this.style === 'auditivo' && this.explanation) {
      fetch('http://localhost:8000/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: this.explanation, voice: 'es-ES-Neural2-A' })
      })
        .then(async r => r.status === 204 ? null : r.blob())
        .then(b => this.ttsUrl = b ? URL.createObjectURL(b) : null)
        .catch(() => this.ttsUrl = null);
    }

    this.prepareForItem();
    this.startTimer();
    this.ready = true;
  }

  prepareForItem() {
    this.feedback = null; this.lastCorrect = null;
    this.mcqAnswer = null;
    this.lefts = []; this.rights = []; this.pairAnswer = [];
    this.bucketAnswer = {};
    this.bucketChoice = {};                   // <-- limpia
    if (!this.item) return;

    if (this.item.type === 'match_pairs') {
      const pairs: [string,string][] = this.item.pairs || [];
      this.lefts = pairs.map(p => p[0]);
      this.rights = pairs.map(p => p[1]);
      this.pairAnswer = new Array(this.lefts.length).fill('');
    }

    if (this.item.type === 'drag_to_bucket') {
      // radios por fila: inicial sin selección
      (this.item.items || []).forEach((it: string) => this.bucketChoice[it] = '');
    }
  }
  formatTime(total: number): string {
    const s = Math.max(0, Math.floor(total));
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${hh}:${mm.toString().padStart(2,'0')}:${ss.toString().padStart(2,'0')}`;
  }

  chooseBucket(it: string, bucket: string) {
    this.bucketChoice[it] = bucket;
  }

  private async doFinishFlow() {
    try {
      await firstValueFrom(this.topics.finish(this.sessionId, this.elapsedSec));
    } catch {}
  
    const mistakes = (this.items ?? []).reduce(
      (acc, _it, i) => acc + (this.items[i]?.__wrongAttempts || 0),
      0
    );
  
    this.finishStats = {
      timeSec: this.elapsedSec,
      mistakes,
      precisionPct: Math.round((this.currentIndex / (this.items?.length || 10)) * 100)
    };
  
    this.showFinish = true;
    clearInterval(this.ticker);
  }

  submit(ans: any) {
    if (this.item?.type === 'multiple_choice' && (ans===null || ans===undefined)) return;
    this.topics.answer(this.sessionId, this.currentIndex, ans).subscribe(r => {
      this.lastCorrect = r.correct;
      this.feedback    = r.feedback;

      if (!r.correct) return;

      // si ya terminó, dispara flujo de fin y corta
      if (r.finished === true || r.nextIndex >= this.items.length) {
        this.doFinishFlow();
        return;
      }
    
      this.currentIndex = r.nextIndex;
      this.item = this.items[this.currentIndex];
      this.prepareForItem();
    });
  }

  submitPairs() {
    // convierte pairAnswer a lista de pares [[left, selectedRight], ...]
    const built = this.lefts.map((L, i) => [L, this.pairAnswer[i]]);
    this.submit(built);
  }

  toggleBucket(bucket: string, val: string, e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    const set = this.bucketAnswer[bucket] ?? (this.bucketAnswer[bucket] = new Set());
    if (checked) set.add(val); else set.delete(val);
  }

  submitBuckets() {
    // Convierte item->bucket a {bucket: [items]}
    const sol: Record<string, string[]> = {};
    for (const b of this.item.buckets || []) sol[b] = [];
    for (const [it, b] of Object.entries(this.bucketChoice)) {
      if (b) sol[b].push(it);
    }
    this.submit(sol);
  }

  retry() {
    this.feedback = null;
    this.lastCorrect = null;
    this.mcqAnswer = null;
    this.pairAnswer = this.pairAnswer?.map(() => '');
    this.bucketChoice = {};                                   // <-- limpia
    Object.keys(this.bucketAnswer).forEach(b => this.bucketAnswer[b]?.clear?.());
  }

  exit() {
    if (confirm('¿Salir del tema? Tu progreso se guardará.')) {
      this.router.navigateByUrl('/home');
    }
  }

  goToHome(): void {
    this.router.navigateByUrl('/home');
  }
}
