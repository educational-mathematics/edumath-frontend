import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../core/auth';
import { Question } from '../../core/models/question.model';
import { BANK } from './test.bank';
import { TestRole } from '../../core/models/test.model';
import { DecimalPipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap, tap } from 'rxjs';
import { Toast } from '../../core/toast';
import { Api } from '../../core/api';
import { inject } from '@angular/core';
import { BadgeToastGuard } from '../../core/badge-toast-guard';

type VAK = 'visual'|'auditivo'|'kinestesico';

@Component({
  selector: 'app-test',
  imports: [DecimalPipe, FormsModule, UpperCasePipe],
  templateUrl: './test.html',
  styleUrl: './test.css'
})
export class Test {

  private api = inject(Api);
  // Paso 0: quién responde
  answeredBy: TestRole | null = null;
  selectedRole: TestRole | null = null;

  // Banco activo según rol
  questions: Question[] = [];

  // 0=Nada, 1=Poco, 2=Mucho
  answers: Record<number, 0|1|2> = {};

  index = 0;

  // Resultados
  showResults = false;
  resultStyle: VAK | null = null;
  resultScores: { visual: number; auditivo: number; kinestesico: number } | null = null;

  showStylePicker = false;
  selectedStyle: VAK | null = null;

  tiedStyles: VAK[] = [];    // estilos empatados
  tiedText = '';             // texto “Visual y Auditivo”, etc.

  private badgeGuard = inject(BadgeToastGuard);

  private pendingTotals?: { visual:number; auditivo:number; kinestesico:number };

  // canvas para confetti
  @ViewChild('confettiCanvas') confettiCanvasRef?: ElementRef<HTMLCanvasElement>;
  private confettiTimer?: any;

  constructor(private auth: Auth, private router: Router, private toast: Toast) {}

  /** Botón CONTINUAR: aquí recién cargamos preguntas */
  confirmRole() {
    if (!this.selectedRole) return;
    this.answeredBy = this.selectedRole;
    this.questions = BANK[this.selectedRole] ?? [];
    this.answers = {};
    this.index = 0;
  }

  current(): Question | undefined {
    return this.questions[this.index];
  }

  setAnswer(qId: number, value: 0|1|2) {
    this.answers[qId] = value;
  }

  next() {
    if (this.index < this.questions.length - 1) this.index++;
  }

  prev() {
    if (this.index > 0) this.index--;
  }

  canSubmit(): boolean {
    const allAnswered = this.questions.every(q => this.answers[q.id] !== undefined);
    return !!this.answeredBy && this.questions.length > 0 && allAnswered;
  }

  submit() {
    const totals = { visual: 0, auditivo: 0, kinestesico: 0 as const };
    for (const q of this.questions) {
      const val = this.answers[q.id] ?? 0;
      totals[q.type] += val;
    }

    const order: VAK[] = ['visual','auditivo','kinestesico'];
    const vals = [totals.visual, totals.auditivo, totals.kinestesico];
    const max = Math.max(...vals);
    const winners: VAK[] = order.filter((k,i) => vals[i] === max);
    const allZero = vals.every(v => v === 0);

    if (allZero || winners.length >= 2) {
      // Solo muestra los empatados
      this.pendingTotals = totals;
      this.tiedStyles = (allZero ? order : winners);
      this.tiedText = this.humanList(this.tiedStyles.map(s => this.styleLabel(s)));
      this.selectedStyle = null;
      this.showStylePicker = true;
      return;
    }

    // Ganador único
    const vakStyle = winners[0];
    this.persistAndShow(vakStyle, totals);
  }

  goHome() {
    this.router.navigateByUrl('/home');
  }

  private persistAndShow(vakStyle: VAK, totals: {visual:number;auditivo:number;kinestesico:number}) {
    this.auth.updateUser({
      vakStyle,
      vakScores: totals,
      testAnsweredBy: this.answeredBy ?? 'alumno',
      testDate: new Date().toISOString(),
    })
    .pipe(
      switchMap(() => this.auth.markFirstLoginDone()) // ← ahora devuelve FirstLoginDoneResp
    )
    .subscribe({
      next: (resp) => {
        // === mostrar insignias SOLO aquí con el guard (ej. 'welcome')
        const list = resp?.awardedBadges as Array<{ slug:string; title:string; imageUrl?:string; description?:string }> | undefined;
        const u = this.auth.getCurrentUser();
        if (u?.id && list?.length) {
          this.badgeGuard.showNewForUser(u.id, list);
        }   

        // … resto de tu lógica (UI/estado) …
        this.resultScores = totals;
        this.resultStyle = vakStyle;
        this.showResults = true;
        this.showStylePicker = false;
        setTimeout(() => this.runConfetti(), 50);
      },
      error: () => {
        // Manejo de error (sin toasts de insignias)
        this.resultScores = totals;
        this.resultStyle = vakStyle;
        this.showResults = true;
        this.showStylePicker = false;
        setTimeout(() => this.runConfetti(), 50);
        this.toast.error('No se pudo marcar el primer ingreso', { timeoutMs: 2500 });
      }
    });
  }

  confirmPreferredStyle() {
    if (!this.selectedStyle || !this.pendingTotals) return;
    this.persistAndShow(this.selectedStyle, this.pendingTotals);
  }
  
  styleLabel(s: VAK): string {
    return s === 'visual' ? 'Visual' : s === 'auditivo' ? 'Auditivo' : 'Kinestésico';
  }

  styleDesc(s: VAK): string {
    switch (s) {
      case 'visual': return 'Aprendes mejor con imágenes, diagramas y ejemplos vistos.';
      case 'auditivo': return 'Prefieres escuchar explicaciones y repetir en voz alta.';
      case 'kinestesico': return 'Aprendes haciendo: manipular, mover, experimentar.';
    }
  }

  private humanList(xs: string[]): string {
    if (xs.length <= 1) return xs[0] ?? '';
    if (xs.length === 2) return `${xs[0]} y ${xs[1]}`;
    return `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`;
  }

  // ====== Confetti ligero sin librerías =======
  private runConfetti() {
    const canvas = this.confettiCanvasRef?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.scale(dpr, dpr);
    };
    resize();

    const colors = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#B794F4','#FFA3A3'];
    const W = () => canvas.clientWidth;
    const H = () => canvas.clientHeight;

    type Particle = { x:number; y:number; vx:number; vy:number; size:number; color:string; rot:number; vr:number; life:number; };
    const parts: Particle[] = [];

    const burst = (n: number) => {
      for (let i=0;i<n;i++){
        parts.push({
          x: W()/2 + (Math.random()*80-40),
          y: H()/3,
          vx: (Math.random()*6-3),
          vy: (Math.random()*-6-4),
          size: Math.random()*6+4,
          color: colors[Math.floor(Math.random()*colors.length)],
          rot: Math.random()*Math.PI,
          vr: (Math.random()*0.2-0.1),
          life: 90 + Math.random()*40
        });
      }
    };

    // 3 ráfagas
    burst(120);
    setTimeout(()=>burst(80), 250);
    setTimeout(()=>burst(80), 550);

    let animId = 0;
    const step = () => {
      animId = requestAnimationFrame(step);
      ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
      parts.forEach(p => {
        p.life -= 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravedad
        p.rot += p.vr;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.6);
        ctx.restore();
      });
      for (let i=parts.length-1;i>=0;i--) if (parts[i].life <= 0 || parts[i].y > H()+40) parts.splice(i,1);
    };
    step();

    // detener y limpiar en ~3.5s
    clearTimeout(this.confettiTimer);
    this.confettiTimer = setTimeout(() => {
      cancelAnimationFrame(animId);
      ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
    }, 3500);

    // reajusta canvas al resize
    const onResize = () => resize();
    window.addEventListener('resize', onResize, { passive: true });

    // quita listener después de animación
    setTimeout(() => window.removeEventListener('resize', onResize), 3600);
  }
}
