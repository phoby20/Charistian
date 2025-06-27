// Setlist 응답 타입 정의
export type SetlistResponse = {
  id: string;
  title: string;
  date: Date;
  description?: string | null;
  fileUrl?: string | null;
  creator: { id: string; name: string };
  church: { name: string };
  scores: Array<{
    creation: { id: string; title: string; fileUrl: string | null };
  }>;
  shares: Array<{
    group?: { id: string; name: string } | null;
    team?: { id: string; name: string } | null;
    user?: { id: string; name: string } | null;
  }>;
};
