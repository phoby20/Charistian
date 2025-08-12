export type SetlistResponse = {
  id: string;
  title: string;
  date: Date;
  description?: string | null;
  fileUrl?: string | null;
  creator: { id: string; name: string };
  church: { name: string };
  scores: Array<{
    creation: {
      id: string;
      title: string;
      scoreKeys: { key: string; fileUrl: string }[];
    }; // fileUrl -> scoreKeys
  }>;
  shares: Array<{
    group?: { id: string; name: string } | null;
    team?: { id: string; name: string } | null;
    user?: { id: string; name: string } | null;
  }>;
};
