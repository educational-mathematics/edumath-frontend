import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Topics } from '../../../core/topics';
import { finalize, firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoadingOverlay } from '../../../shared/components/loading-overlay/loading-overlay';
import { Tips } from '../../../core/tips';
import { ActivityRenderer } from '../../../shared/interactive/activity-renderer/activity-renderer';
import { A } from '@angular/cdk/keycodes';
import { Toast } from '../../../core/toast';
import { Api } from '../../../core/api';
import { Auth } from '../../../core/auth';
import { BadgeToastGuard } from '../../../core/badge-toast-guard';

type VAK = 'visual'|'auditivo'|'kinestesico';
type AudioState = 'loading' | 'stopped' | 'playing';

interface Confetto {
  x: number;
  y: number;
  r: number; // Radio
  d: number; // Densidad
  color: string;
  tilt: number;
  tiltAngle: number;
  tiltAngleSpeed: number;
}

@Component({
  selector: 'app-topic-play',
  imports: [CommonModule, FormsModule, LoadingOverlay, ActivityRenderer],
  templateUrl: './topic-play.html',
  styleUrl: './topic-play.css'
})
export class TopicPlay {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private topics = inject(Topics);

  private toast = inject(Toast);
  private api = inject(Api);
  private auth = inject(Auth);
  private guard = inject(BadgeToastGuard);

  private finishing = false;

  private abs(u?: string | null) {
    if (!u) return '';
    return u.startsWith('http') ? u : (this.apiBase + u);
  }

  readonly apiBase = environment.apiUrl;

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

  explanationImageUrl: string | null = null;

  showExitConfirm = false;

  private autosaveTimer: any;
  //showRestartConfirm = false;

  tipsSvc = inject(Tips);
  loading = false;

  private kinLock = false;

  // Inyectar el elemento de audio para la explicación
  @ViewChild('ttsAudio', { static: false }) ttsAudioRef!: ElementRef<HTMLAudioElement>;
  // Inyectar el elemento de audio para la pregunta (MCQ)
  @ViewChild('questionAudio', { static: false }) questionAudioRef!: ElementRef<HTMLAudioElement>;
  
  // Nuevo estado para la interfaz del reproductor
  audioState: AudioState = 'stopped';

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    const reset = this.route.snapshot.queryParamMap.get('reset') === '1';
    //const res = await firstValueFrom(this.topics.openBySlug(slug, reset));

    this.loading = true;
    try {
      const res = await firstValueFrom(
        this.topics.openBySlug(slug, reset)
      );
      this._load(res);
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    } finally {
      this.loading = false;
    }

    //this._load(res);
    //window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  ngOnDestroy() {
    if (this.ticker) clearInterval(this.ticker);
    if (this.autosaveTimer) clearInterval(this.autosaveTimer);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }
  private handleBeforeUnload = (e: BeforeUnloadEvent) => {
    this.saveNow();
  };

  startTimer() { this.ticker = setInterval(() => this.elapsedSec++, 1000); }

  private _load(res: any) {
    // limpia timers previos
    if (this.ticker) clearInterval(this.ticker);
    if (this.autosaveTimer) clearInterval(this.autosaveTimer);
    this.ready = false;

    this.sessionId = res.sessionId;
    this.title = res.title;
    this.style = res.style as VAK;
    this.explanation = res.explanation || null;
    this.items = res.items || [];
    this.currentIndex = res.currentIndex || 0;
    this.item = this.items[this.currentIndex] || null;

    this.ttsUrl = res.explanationAudioUrl || null;
    this.explanationImageUrl = res.explanationImageUrl || null;

    if (this.style === 'auditivo' && this.explanation && !this.ttsUrl) {
      this.audioState = 'loading';
      fetch('http://localhost:8000/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: this.explanation, voice: 'es-ES-Standard-A' })
      })
        .then(async r => r.status === 204 ? null : r.blob())
        .then(b => { this.ttsUrl = b ? URL.createObjectURL(b) : null; this.audioState = 'stopped'; })
        .catch(() => { this.ttsUrl = null; this.audioState = 'stopped'; });
    }

    this.prepareForItem();
    this.startTimer();

    // autosave solo con sessionId válido
    this.autosaveTimer = setInterval(() => this.saveNow(), 15000);

    this.ready = true;
  }

  toggleAudio() {
    if (this.audioState === 'loading' || !this.ttsAudioRef) return;
    
    const audio = this.ttsAudioRef.nativeElement;

    if (this.audioState === 'playing') {
      audio.pause();
      this.audioState = 'stopped';
    } else {
      audio.play().catch(e => console.error("Error al reproducir audio:", e));
      this.audioState = 'playing';
      
      // Manejar el fin de la reproducción
      audio.onended = () => {
        this.audioState = 'stopped';
      };
    }
  }

  // Función para manejar la reproducción del audio de la PREGUNTA (MCQ)
  toggleQuestionAudio() {
    if (!this.questionAudioRef) return;
    
    const audio = this.questionAudioRef.nativeElement;
    
    // Simplificado: solo reproducir una vez al hacer clic
    if (audio.paused) {
      audio.currentTime = 0; // Reiniciar
      audio.play().catch(e => console.error("Error al reproducir audio de pregunta:", e));
    } else {
      audio.pause();
    }
  }

  onKinestheticAnswer(payload: { value: any; isComplete: boolean }) {
    if (!payload?.isComplete || this.kinLock) return;
    this.kinLock = true;
    
    this.topics.answer(this.sessionId, this.currentIndex, payload.value).subscribe({
      next: r => {
        this.lastCorrect = r.correct;
        this.feedback = r.feedback;
      
        if (!r.correct) { this.kinLock = false; return; }
      
        if (r.finished === true || r.nextIndex >= this.items.length) {
          this.doFinishFlow();
          return;
        }
      
        this.currentIndex = r.nextIndex;
        this.item = this.items[this.currentIndex];
        this.prepareForItem();
        this.saveNow();
        this.kinLock = false;
      },
      error: _ => { this.kinLock = false; }
    });
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
    if (this.finishing) return;
    this.finishing = true;
  
    try {
      const r = await firstValueFrom(this.topics.finish(this.sessionId, this.elapsedSec));
    
      const awarded = (r as any)?.awardedBadges as Array<{ slug:string; title:string; imageUrl?:string; description?:string }> | undefined;
      const u = this.auth.getCurrentUser();
      if (u?.id && awarded?.length) {
        this.guard.showNewForUser(u.id, awarded);
      }
    
      this.auth.refreshMe().subscribe({ error: () => {} });
    
      this.finishStats = {
        timeSec: r.timeSec ?? this.elapsedSec,
        mistakes: r.mistakes ?? 0,
        precisionPct: r.precisionPct ?? Math.round((this.currentIndex / (this.items?.length || 10)) * 100)
      };
    } catch {
      const mistakes = (this.items ?? []).reduce((acc, _it, i) => acc + (this.items[i]?.__wrongAttempts || 0), 0);
      this.finishStats = { timeSec: this.elapsedSec, mistakes, precisionPct: Math.round((this.currentIndex / (this.items?.length || 10)) * 100) };
    } finally {
      this.showFinish = true;
      clearInterval(this.ticker);
      setTimeout(() => this.startConfetti(), 100);
      this.finishing = false;
    }
  }

  startConfetti() {
    if (typeof window === 'undefined') return;

    const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajustar el tamaño del canvas al tamaño del viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const NUM_CONFETTI = 100;
    const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];
    const confetti: Confetto[] = [];

    // Función para inicializar las partículas
    const initConfetti = () => {
      for (let i = 0; i < NUM_CONFETTI; i++) {
        confetti.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height, // Empieza fuera de pantalla
          r: (Math.random() * 6) + 3, // Radio (tamaño)
          d: (Math.random() * NUM_CONFETTI),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          tilt: Math.floor(Math.random() * 10) - 10,
          tiltAngle: 0,
          tiltAngleSpeed: Math.random() * 0.1 + 0.05 // Velocidad de giro
        });
      }
    };

    // Dibujar y animar
    let animationFrameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let particle: Confetto;
      let nextX: number;
      let nextY: number;

      for (let i = 0; i < confetti.length; i++) {
        particle = confetti[i];

        // Movimiento: Simula la caída (y) y viento (x)
        particle.tiltAngle += particle.tiltAngleSpeed;
        particle.tilt = Math.sin(particle.tiltAngle) * 15; // Simula el giro
        particle.y += Math.cos(particle.d) + 3 + particle.r / 2; // Caída
        particle.x += Math.sin(particle.d) * 0.5; // Movimiento lateral (viento)

        // Reposicionar confeti si sale por abajo
        if (particle.y > canvas.height) {
          particle.x = Math.random() * canvas.width;
          particle.y = -particle.r; // Vuelve arriba
          particle.tilt = Math.floor(Math.random() * 10) - 10;
          particle.tiltAngle = 0;
        }

        // Dibujar Confeti (rectángulo girado)
        ctx.beginPath();
        ctx.lineWidth = particle.r * 2;
        ctx.strokeStyle = particle.color;

        nextX = particle.x + particle.tilt;
        nextY = particle.y;

        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(nextX, nextY + particle.r * 2 * Math.cos(particle.tiltAngle));
        ctx.stroke();
      }

      animationFrameId = window.requestAnimationFrame(draw);
    };

    // Limpiar la animación después de un tiempo (ej. 3 segundos)
    const duration = 3000;
    setTimeout(() => {
      window.cancelAnimationFrame(animationFrameId);
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpia el canvas
    }, duration);

    initConfetti();
    draw();
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
      this.saveNow();
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

  confirmExit() { 
    this.showExitConfirm = true; 
  }

  restartTopic() {
    //this.showRestartConfirm = false;
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.topics.openBySlug(slug, true).subscribe(r2 => this._load(r2));
  }

  exit() {
    this.topics.save(this.sessionId, this.currentIndex, this.elapsedSec).subscribe({
      complete: () => this.router.navigateByUrl('/home'),
      error:    () => this.router.navigateByUrl('/home'),
    });
    this.showExitConfirm = false;
  }

  goToHome(): void {
    this.router.navigateByUrl('/home');
  }

  private saveNow(): void {
    try {
      if (!this.ready || !this.sessionId) return;   // ← evita POST /topics/save/ID viejo
      const idx = this.currentIndex ?? 0;
      const time = this.elapsedSec ?? 0;
      this.topics.save(this.sessionId, idx, time).subscribe({ error: _ => {} });
    } catch {}
  }
}
