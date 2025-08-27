export type TestRole = 'alumno' | 'representante';

export interface TestResult {
    role: TestRole;
    scores: { visual: number; auditivo: number; kinestesico: number };
    dominantStyle: 'visual' | 'auditivo' | 'kinestesico';
    date: string; // ISO string
}