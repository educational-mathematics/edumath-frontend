import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../core/auth';
import { Question } from '../../core/models/question.model';
import { BANK } from './test.bank';
import { TestRole } from '../../core/models/test.model';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-test',
  imports: [DecimalPipe, FormsModule],
  templateUrl: './test.html',
  styleUrl: './test.css'
})
export class Test {
  // Paso 0: quién responde
  answeredBy: TestRole | null = null;

  selectedRole: TestRole | null = null; // Para el selector de rol

  // Banco activo según rol
  questions: Question[] = [];

  // 0=Nada, 1=Poco, 2=Mucho
  answers: Record<number, 0|1|2> = {};

  index = 0;

  constructor(private auth: Auth, private router: Router) {}

  /** Botón CONTINUAR: aquí recién cargamos preguntas */
  confirmRole() {
    if (!this.selectedRole) return;
    this.answeredBy = this.selectedRole;
    this.questions = BANK[this.selectedRole] ?? [];
    this.answers = {};
    this.index = 0;
    console.log('[TEST] Rol confirmado:', this.answeredBy, 'Preguntas:', this.questions.length);
  }

  current(): Question | undefined {
    return this.questions[this.index];
  }

  setAnswer(qId: number, value: 0|1|2) {
    this.answers[qId] = value;
    console.log(`[TEST] Q${qId} = ${value}`);
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

    console.log('[TEST] Puntajes finales:', scores);

    const vakStyle = (Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0]) as 'visual'|'auditivo'|'kinestesico';
    console.log('[TEST] Estilo dominante:', vakStyle);

    this.auth.updateUser({
      vakStyle,
      vakScores: scores,
      testAnsweredBy: this.answeredBy ?? 'alumno',
      testDate: new Date().toISOString(),
      firstLoginDone: true
    }).subscribe(() => {
      console.log('[TEST] Guardado OK');
      this.router.navigateByUrl('/home');
    });
  }
}
