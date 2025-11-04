export type ExerciseType = 'multiple_choice' | 'match_pairs' | 'drag_to_bucket';

export interface MatchPairsItem {
  type: 'match_pairs';
  title: string;
  pairs: [string, string][];
  explain?: string;
}

export interface DragToBucketItem {
  type: 'drag_to_bucket';
  title: string;
  items: string[];
  buckets: string[];
  solution: Record<string, string[]>;
  explain?: string;
}

export type ExerciseItem = MatchPairsItem | DragToBucketItem;

export interface AnswerPayload {
  value: any;
  isComplete: boolean;
}