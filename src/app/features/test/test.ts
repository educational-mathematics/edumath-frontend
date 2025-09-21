import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../core/auth';
import { Question } from '../../core/models/question.model';
import { BANK } from './test.bank';
import { TestRole } from '../../core/models/test.model';
import { DecimalPipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

type VAK = 'visual'|'auditivo'|'kinestesico';

@Component({
  selector: 'app-test',
  imports: [DecimalPipe, FormsModule, UpperCasePipe],
  templateUrl: './test.html',
  styleUrl: './test.css'
})
export class Test {
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

  // canvas para confetti
  @ViewChild('confettiCanvas') confettiCanvasRef?: ElementRef<HTMLCanvasElement>;
  private confettiTimer?: any;

  constructor(private auth: Auth, private router: Router) {}

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
    const scores = { visual: 0, auditivo: 0, kinestesico: 0 };
    for (const q of this.questions) scores[q.type] += this.answers[q.id] ?? 0;

    const vakStyle = (Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0]) as VAK;

    // Actualiza backend y luego muestra resultados (sin navegar aún)
    this.auth.updateUser({
      vakStyle,
      vakScores: scores,
      testAnsweredBy: this.answeredBy ?? 'alumno',
      testDate: new Date().toISOString(),
      firstLoginDone: true
    }).subscribe(() => {
      this.resultScores = scores;
      this.resultStyle = vakStyle;
      this.showResults = true;
      // lanza confetti
      setTimeout(() => this.runConfetti(), 50);
    });
  }

  goHome() {
    this.router.navigateByUrl('/home');
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
