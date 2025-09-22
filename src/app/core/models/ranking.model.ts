export interface RankingRow {
    rank: number;
    alias: string;
    points: number;
    avatar_url?: string; // viene en snake, o lo mapeas a camel si prefieres
}