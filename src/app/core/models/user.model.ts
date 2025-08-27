export interface User {
    id: number;
    password: string;
    email: string;
    name: string;
    firstLoginDone: boolean;
    vakStyle?: 'visual' | 'auditivo' | 'kinestesico';
    vakScores?: { visual: number; auditivo: number; kinestesico: number };
    testAnsweredBy?: 'alumno' | 'representante';
    testDate?: string; // ISO
}