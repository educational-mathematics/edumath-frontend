import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Topics } from '../../../core/topics';

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

  feedback: string | null = null;
  lastCorrect: boolean | null = null;

  // timer
  elapsedSec = 0;
  private ticker: any;

  progressPct = 0;
  
  ready = false;

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.topics.openBySlug(slug).subscribe(res => {
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
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ text: this.explanation, voice: 'Kore' })
        })
          .then(async r => r.status === 204 ? null : r.blob())
          .then(b => this.ttsUrl = b ? URL.createObjectURL(b) : null)
          .catch(() => this.ttsUrl = null);
      }

      this.prepareForItem();
      this.startTimer();
      this.ready = true;
    });
  }
  ngOnDestroy() { if (this.ticker) clearInterval(this.ticker); }
  startTimer() { this.ticker = setInterval(() => this.elapsedSec++, 1000); }

  prepareForItem() {
    this.feedback = null; this.lastCorrect = null;
    this.mcqAnswer = null;
    this.lefts = []; this.rights = []; this.pairAnswer = [];
    this.bucketAnswer = {};
    if (!this.item) return;

    if (this.item.type === 'match_pairs') {
      const pairs: [string,string][] = this.item.pairs || [];
      this.lefts = pairs.map(p => p[0]);
      this.rights = pairs.map(p => p[1]);
      this.pairAnswer = new Array(this.lefts.length).fill('');
    }
    if (this.item.type === 'drag_to_bucket') {
      (this.item.buckets || []).forEach((b: string) => this.bucketAnswer[b] = new Set());
    }
  }

  submit(ans: any) {
    if (this.item?.type === 'multiple_choice' && (ans===null || ans===undefined)) return;
    this.topics.answer(this.sessionId, this.currentIndex, ans).subscribe(r => {
      this.lastCorrect = r.correct;
      this.feedback    = r.feedback;

      // Sugerencia de estilo (si viene)
      // if (r.recommendedStyle) { /* muestra banner/tooltip para avisar */ }

      if (r.correct) {
        this.currentIndex = r.nextIndex;
        if (this.currentIndex >= 10) {
          this.finish();
        } else {
          this.item = this.items[this.currentIndex];
          this.prepareForItem();
        }
      }
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
    // convierte bucketAnswer a objeto {bucket: [items]}
    const sol: Record<string, string[]> = {};
    for (const [b,set] of Object.entries(this.bucketAnswer)) sol[b] = Array.from(set);
    this.submit(sol);
  }

  retry() { 
    this.feedback = null;
    this.lastCorrect = null;
    this.mcqAnswer = null;
    this.pairAnswer = this.pairAnswer?.map(() => '');
    Object.keys(this.bucketAnswer).forEach(b => this.bucketAnswer[b].clear());
  }

  finish() {
    this.topics.finish(this.sessionId).subscribe(() => {
      this.router.navigateByUrl('/home');
    });
  }

  exit() {
    if (confirm('¿Salir del tema? Tu progreso se guardará.')) {
      this.router.navigateByUrl('/home');
    }
  }
}
