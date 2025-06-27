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
  titleEn: string | null;
  titleJa: string | null;
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
  isOpen: boolean;
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

export interface Score {
  id: string;
  title: string;
  titleEn: string;
  titleJa: string;
  description?: string;
  thumbnailUrl?: string;
  genre?: string;
  tempo?: number;
  key?: string;
  fileUrl: string;
  referenceUrls?: string[];
  creator: { name: string };
  composer?: string;
  lyricist?: string;
  _count: { likes: number; comments: number };
  likes: { id: string }[];
}

export interface Share {
  id: string;
  group?: { id: string; name: string };
  team?: { id: string; name: string };
  user?: { id: string; name: string };
}

export interface Setlists {
  id: string;
  title: string;
  date: string;
  creator: { name: string; id: string };
  church: { name: string };
  shares: Share[];
}

export interface Creation {
  id: string;
  title: string;
}

export interface Group {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
}

export interface Share {
  id: string;
  group?: { id: string; name: string };
  team?: { id: string; name: string };
  user?: { id: string; name: string };
}

export interface Setlists {
  id: string;
  title: string;
  date: string;
  description?: string;
  creatorId: string;
  scores: { id: string; creation: Creation; order: number }[];
  shares: Share[];
}

export interface SelectedSong {
  id: string;
  title: string;
  titleEn: string;
  titleJa: string;
  key: string;
  fileUrl: string;
  referenceUrls: string[];
}

export interface SetlistResponse {
  id: string;
  title: string;
  date: string;
  description?: string;
  fileUrl: string | null;
  creator: { name: string; id: string };
  creatorId: string;
  scores: {
    id: string;
    creation: SelectedSong;
    order: number;
  }[];
  comments: {
    id: string;
    user: { name: string };
    content: string;
    createdAt: string;
  }[];
  shares: Share[];
}
