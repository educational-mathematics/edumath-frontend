export type VakStyle = 'visual' | 'auditivo';

export type ExplStatus = 'completed' | 'in_progress' | 'interrupted' | 'failed';

export interface AssistantTopicInfo {
  id: number;
  grade: number;
  slug: string;
  title: string;
}

export interface Paragraph {
  id: string;
  text: string;
  audioUrl?: string;
  imageUrl?: string;
}

export interface Explanation {
  id: string;
  topicId: number;
  topicTitle: string;
  grade: number;
  style: VakStyle;
  createdAt: string;
  status: ExplStatus;
  paragraphs: Paragraph[];
  notes?: string;
}

export interface HistoryGroup {
  grade: number;
  topics: {
    topicId: number;
    topicTitle: string;
    visual?: Explanation;
    auditivo?: Explanation;
  }[];
}