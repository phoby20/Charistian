// src/types/score.ts
export interface ScoreComment {
  id: string;
  creationId: string;
  userId: string;
  user: { name: string };
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreResponse {
  id: string;
  title: string;
  titleEn?: string;
  titleJa?: string;
  description?: string;
  tempo?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  price?: number;
  key?: string;
  referenceUrls?: string[];
  lyrics?: string;
  lyricsEn?: string;
  lyricsJa?: string;
  composer?: string;
  lyricist?: string;
  saleStartDate?: string;
  saleEndDate?: string;
  genre?: string;
  isPublic: boolean;
  isForSale: boolean;
  isOriginal: boolean;
  creatorId: string;
  creator: { name: string };
  churchId: string;
  likes: { id: string }[];
  comments: ScoreComment[];
  _count: { likes: number; comments: number };
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreFormData {
  title: string;
  titleEn?: string;
  titleJa?: string;
  description?: string;
  tempo?: string;
  file: File | null;
  thumbnail?: File | null;
  price?: string;
  referenceUrls: { url: string }[];
  lyrics?: string;
  lyricsEn?: string;
  lyricsJa?: string;
  composer?: string;
  lyricist?: string;
  saleStartDate?: string;
  saleEndDate?: string;
  isPublic: boolean;
  isForSale: boolean;
  isOriginal: boolean;
  genre?: string; // 새로 추가
  key?: string;
}

export interface ApiErrorResponse {
  error: string;
}

export interface ApiSuccessResponse {
  id: string;
}
