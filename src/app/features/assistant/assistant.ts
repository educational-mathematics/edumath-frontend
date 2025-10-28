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
  private core = inject(Api);
  private api = inject(AssistantApi);

  abs(u?: string|null){ return this.core.absolute(u ?? undefined) ?? ''; }

  userName = '[usuario]';
  topics: AssistantTopicInfo[] = [];
  topicsByGrade: { grade: number; items: AssistantTopicInfo[] }[] = [];
  history: HistoryGroup[] = [];

  selectedTopicId: number | null = null;
  current: Explanation | null = null;

  /** Tab activo del detalle (visual|auditivo). Se fija al abrir. */
  activeTab: VakStyle = 'visual';

  private pollTimer?: any;

  constructor(private auth: Auth) {}

  ngOnInit() {
    const u = this.auth.getCurrentUser();
    if (u?.name) this.userName = u.name;
    this.loadTopics();
    this.loadHistory();
  }
  ngOnDestroy() { clearInterval(this.pollTimer); }

  // -------- catálogo completo (como Home) ----------
  loadTopics() {
    this.core.get<Record<string, any[]>>('/topics/catalog').subscribe({
      next: data => {
        const list: AssistantTopicInfo[] = [];
        Object.entries(data || {}).forEach(([gradeStr, arr]) => {
          const grade = Number(gradeStr);
          (arr || []).forEach((t: any) => {
            list.push({ id: t.id, grade, slug: t.slug, title: t.title, coverUrl: this.core.absolute(t.coverUrl) });
          });
        });
        list.sort((a,b)=> (a.grade-b.grade) || a.title.localeCompare(b.title));
        this.topics = list;
        const map = new Map<number, AssistantTopicInfo[]>();
        list.forEach(t => { if(!map.has(t.grade)) map.set(t.grade, []); map.get(t.grade)!.push(t); });
        this.topicsByGrade = [...map.entries()].sort((a,b)=>a[0]-b[0]).map(([grade,items])=>({grade,items}));
      },
      error: _ => { this.topics = []; this.topicsByGrade = []; }
    });
  }

  // -------- historial ----------
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

  // -------- acciones ----------
  startSelected(style: VakStyle) {
    const id = this.selectedTopicId!;
    this.activeTab = style;
    this.api.startExplanation(id, style).subscribe(({ explanationId }) => this.open(explanationId));
  }

  startOther(style: VakStyle) {
    if (!this.current) return;
    this.activeTab = style;
    this.api.startExplanation(this.current.topicId, style).subscribe(({ explanationId }) => this.open(explanationId));
  }

  /** Abrir desde historial: por defecto abre la PRIMERA generada (visual si existe, si no auditivo). */
  openFromHistory(topicId: number, prefer?: VakStyle) {
    const g = this.history.flatMap(h => h.topics).find(x => x.topicId === topicId);
    const target =
      prefer ? (prefer === 'visual' ? g?.visual : g?.auditivo)
             : (g?.visual ?? g?.auditivo);
    if (target) {
      this.activeTab = (target.style as VakStyle) || 'visual';
      this.open(target.id);
    }
  }

  open(explanationId: string) {
    this.api.getExplanation(explanationId).subscribe(exp => {
      exp.paragraphs = (exp.paragraphs || []).map(p => ({
        ...p, imageUrl: this.abs(p.imageUrl), audioUrl: this.abs(p.audioUrl)
      }));
      this.current = exp;

      // asegura que el tab apunte al estilo de lo que se cargó
      this.activeTab = (exp.style as VakStyle) || 'visual';

      clearInterval(this.pollTimer);
      if (exp.status === 'in_progress') {
        this.pollTimer = setInterval(() => {
          this.api.getExplanation(explanationId).subscribe(e2 => {
            e2.paragraphs = (e2.paragraphs || []).map(p => ({
              ...p, imageUrl: this.abs(p.imageUrl), audioUrl: this.abs(p.audioUrl)
            }));
            this.current = e2;
            if (e2.status !== 'in_progress') {
              clearInterval(this.pollTimer);
              this.loadHistory();
            }
          });
        }, 1800);
      } else {
        this.loadHistory();
      }
    });
  }

  resume() {
    if (!this.current) return;
    this.api.resumeExplanation(this.current.id).subscribe(() => this.open(this.current!.id));
  }

  /** Bloquea generar “el otro” si ya está en progreso algo. */
  canGenerateOther(style: VakStyle): boolean {
    if (!this.current) return false;
    if (this.current.status === 'in_progress') return false;
    const g = this.history.flatMap(h => h.topics).find(x => x.topicId === this.current!.topicId);
    if (!g) return style === (this.current.style === 'visual' ? 'auditivo' : 'visual');
    return (style === 'visual' && !g.visual) || (style === 'auditivo' && !g.auditivo);
  }

  switchTab(style: VakStyle) {
    this.activeTab = style;

    if (!this.current) return;

    // si hay explicación de ese estilo en historial, ábrela; si no, solo cambiamos el tab
    const g = this._groupForCurrent();
    const target = style === 'visual' ? g?.visual : g?.auditivo;
    if (target && target.id !== this.current.id) this.open(target.id);
  }

  closeDetail() {
    this.current = null;
    this.selectedTopicId = null;
    clearInterval(this.pollTimer);
    this.loadHistory();
  }

  private _groupForCurrent() {
    if (!this.current) return undefined;
    return this.history.flatMap(h => h.topics).find(x => x.topicId === this.current!.topicId);
  }
  hasStyle(style: VakStyle): boolean {
    const g = this._groupForCurrent();
    const rec = style === 'visual' ? g?.visual : g?.auditivo;
    return !!rec;
  }
  hasCompletedStyle(style: VakStyle): boolean {
    const g = this._groupForCurrent();
    const rec = style === 'visual' ? g?.visual : g?.auditivo;
    return !!rec && rec.status === 'completed';
  }

  get shouldShowTabs(): boolean {
    if (!this.current) return false;
    return this.current.status === 'completed'
        || this.hasCompletedStyle('visual')
        || this.hasCompletedStyle('auditivo');
  }

  get shouldShowParagraphs(): boolean {
    return !!this.current && this.current.style === this.activeTab;
  }
}