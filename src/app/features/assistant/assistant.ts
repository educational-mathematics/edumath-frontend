import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AssistantApi } from '../../core/assistant-api';
import { AssistantTopicInfo, Explanation, HistoryGroup, VakStyle } from '../../core/models/assistant.model';
import { Navbar } from '../../shared/components/navbar/navbar';
import { Auth } from '../../core/auth';
import { Api } from '../../core/api';

@Component({
  selector: 'app-assistant',
  imports: [Navbar, FormsModule],
  templateUrl: './assistant.html',
  styleUrl: './assistant.css'
})
export class Assistant implements OnInit, OnDestroy {
  // Api del backend con base http://localhost:8000
  private core = inject(Api);

  // Api específica del asistente (historial / explicaciones)
  private api = inject(AssistantApi);

  userName = '[usuario]';

  // catálogo completo (como en Home)
  topics: AssistantTopicInfo[] = [];
  topicsByGrade: { grade: number; items: AssistantTopicInfo[] }[] = [];

  // historial
  history: HistoryGroup[] = [];

  // selección
  selectedTopicId: number | null = null;

  // explicación abierta (detalle)
  current: Explanation | null = null;

  // polling cuando esté "in_progress"
  private pollTimer?: any;

  constructor(private auth: Auth) {}

  ngOnInit() {
    const u = this.auth.getCurrentUser();
    if (u?.name) this.userName = u.name;

    this.loadTopics();   // ahora trae TODO el catálogo desde /topics/catalog (backend)
    this.loadHistory();  // historial del asistente
  }

  ngOnDestroy() {
    clearInterval(this.pollTimer);
  }

  // ====== Carga Catálogo (TODOS los temas) ======
  loadTopics() {
    // /topics/catalog devuelve { "3":[{id,slug,title,coverUrl},...], "4":[...], ... }
    this.core.get<Record<string, any[]>>('/topics/catalog').subscribe({
      next: data => {
        const list: AssistantTopicInfo[] = [];
        Object.entries(data || {}).forEach(([gradeStr, arr]) => {
          const grade = Number(gradeStr);
          (arr || []).forEach((t: any) => {
            list.push({
              id: t.id,
              grade,
              slug: t.slug,
              title: t.title,
              // si necesitas portada en esta vista:
              coverUrl: this.core.absolute(t.coverUrl)
            });
          });
        });

        // ordena por grado y título
        list.sort((a, b) => (a.grade - b.grade) || a.title.localeCompare(b.title));
        this.topics = list;

        // agrupa por grado (como hacías antes)
        const map = new Map<number, AssistantTopicInfo[]>();
        list.forEach(t => {
          if (!map.has(t.grade)) map.set(t.grade, []);
          map.get(t.grade)!.push(t);
        });
        this.topicsByGrade = [...map.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([grade, items]) => ({ grade, items }));
      },
      error: _ => {
        this.topics = [];
        this.topicsByGrade = [];
      }
    });
  }

  // ====== Carga Historial ======
  loadHistory() {
    this.api.getHistory().subscribe({
      next: res => { this.history = res || []; },
      error: _ => { this.history = []; }
    });
  }

  isTopicAlreadyExplained(topicId: number): boolean {
    const g = this.history.flatMap(h => h.topics).find(x => x.topicId === topicId);
    return !!g;
  }

  // ====== Acciones ======
  startSelected(style: VakStyle) {
    const id = this.selectedTopicId!;
    this.api.startExplanation(id, style).subscribe(({ explanationId }) => {
      this.open(explanationId);
    });
  }

  startOther(style: VakStyle) {
    if (!this.current) return;
    this.api.startExplanation(this.current.topicId, style).subscribe(({ explanationId }) => {
      this.open(explanationId);
    });
  }

  openFromHistory(topicId: number) {
    const g = this.history.flatMap(h => h.topics).find(x => x.topicId === topicId);
    const candidate = (g?.auditivo ?? g?.visual);
    if (candidate) this.open(candidate.id);
  }

  open(explanationId: string) {
    this.api.getExplanation(explanationId).subscribe(exp => {
      this.current = exp;
      clearInterval(this.pollTimer);
      if (exp.status === 'in_progress') {
        this.pollTimer = setInterval(() => {
          this.api.getExplanation(explanationId).subscribe(e2 => {
            this.current = e2;
            if (e2.status !== 'in_progress') {
              clearInterval(this.pollTimer);
              this.loadHistory();
            }
          });
        }, 2000);
      } else {
        this.loadHistory();
      }
    });
  }

  resume() {
    if (!this.current) return;
    this.api.resumeExplanation(this.current.id).subscribe(() => this.open(this.current!.id));
  }

  canGenerateOther(style: VakStyle): boolean {
    if (!this.current) return false;
    const g = this.history.flatMap(h => h.topics).find(x => x.topicId === this.current!.topicId);
    if (!g) return style === (this.current.style === 'visual' ? 'auditivo' : 'visual');
    return (style === 'visual' && !g.visual) || (style === 'auditivo' && !g.auditivo);
  }

  closeDetail() {
    this.current = null;
    this.selectedTopicId = null;
    clearInterval(this.pollTimer);
    this.loadHistory();
  }
}