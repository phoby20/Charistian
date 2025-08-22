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

export type SetlistsResponse = {
  id: string;
  title: string;
  date: Date;
  description?: string | null;
  fileUrl?: string | null;
  creatorId: string;
  churchId: string;
  createdAt: Date;
  updatedAt: Date;
  creator: { id: string; name: string };
  church: { name: string };
  scores: Array<{
    id: string;
    order: number;
    selectedReferenceUrl?: string | null;
    selectedKey?: string | null;
    creation: {
      id: string;
      title: string;
      titleEn?: string | null;
      titleJa?: string | null;
      referenceUrls?: string[] | null;
      scoreKeys: { key: string; fileUrl: string }[];
    };
  }>;
  shares: Array<{
    id: string;
    setlistId: string;
    groupId: string | null;
    teamId: string | null;
    userId: string | null;
    createdAt: Date;
    group?: { id: string; name: string } | null;
    team?: { id: string; name: string } | null;
    user?: { id: string; name: string } | null;
  }>;
};
