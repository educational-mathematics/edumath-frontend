export interface Badge {
    id: number;
    slug: string;
    title: string;
    description: string;
    imageUrl?: string;
    rarityPct: number;   // 0..100 (2 decimales)
    owned: boolean;      // si el usuario la tiene
}