export interface User {
    id: number;
    email: string;
    name: string;
    firstLoginDone: boolean;
    emailVerified: boolean;

    avatarUrl?: string;
    vakStyle?: 'visual' | 'auditivo' | 'kinestesico';
    vakScores?: { visual: number; auditivo: number; kinestesico: number };
    testAnsweredBy?: 'alumno' | 'representante';
    testDate?: string; // ISO

    // El backend NUNCA devuelve password; si la usas en formularios, que sea opcional
    password?: string;
}