// src/types/score.ts
export type ScoreResponse = {
  title: string;
  titleEn?: string;
  titleJa?: string;
  description?: string;
  tempo?: string;
  fileUrl: string;
  thumbnailUrl?: string;
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
};

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
}

export interface ApiErrorResponse {
  error: string;
}

export interface ApiSuccessResponse {
  id: string;
}
