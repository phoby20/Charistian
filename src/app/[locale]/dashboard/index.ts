// src/app/[locale]/dashboard/index.ts
import { getKoreaDate } from "@/utils/creatKoreaDate";
import { ChurchApplication, User } from "@prisma/client";
import { subDays } from "date-fns";
import { Dispatch, SetStateAction } from "react";
import { UserWithRelations } from "@/types/customUser";

interface AttendanceRecord {
  userId: string;
  date: string;
}

export interface MemberStatsData {
  totalMembers: number;
  roleDistribution: { [role: string]: number };
  recentMembers: UserWithRelations[];
}

export interface AttendanceStatsData {
  todayCount: number;
  weekRate: number;
  last7Days: { date: string; count: number }[];
}

export const fetchData = async (
  user: User | null,
  isLoading: boolean,
  setPendingChurches: Dispatch<SetStateAction<ChurchApplication[]>>,
  setFetchError: Dispatch<SetStateAction<string | null>>,
  setIsLoading: Dispatch<SetStateAction<boolean>>,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): Promise<{
  members: UserWithRelations[];
  attendances: AttendanceRecord[];
}> => {
  if (!user || isLoading) {
    return { members: [], attendances: [] };
  }
  setIsLoading(true);
  try {
    // Fetch pending data
    const pendingResponse = await fetch("/api/pending", {
      credentials: "include",
    });

    if (!pendingResponse.ok) throw new Error("Failed to fetch pending data");
    const {
      pendingChurches,
    }: {
      pendingChurches: ChurchApplication[];
    } = await pendingResponse.json();
    setPendingChurches(pendingChurches);

    // Fetch all members
    const membersResponse = await fetch("/api/members", {
      credentials: "include",
    });

    if (!membersResponse.ok) throw new Error("Failed to fetch members");
    const { members }: { members: UserWithRelations[] } =
      await membersResponse.json();

    // Fetch attendance stats (SUPER_ADMIN, ADMIN only)
    let attendances: AttendanceRecord[] = [];
    if (["SUPER_ADMIN", "ADMIN"].includes(user.role) && user.churchId) {
      const today = getKoreaDate();
      const startDate = subDays(today, 6).toISOString().split("T")[0];

      const attendanceResponse = await fetch(
        `/api/attendance/search?startDate=${startDate}&endDate=${today.toISOString().split("T")[0]}`,
        { credentials: "include" }
      );

      if (!attendanceResponse.ok) throw new Error("Failed to fetch attendance");
      const responseData = await attendanceResponse.json();
      attendances = responseData.attendances || [];
    }

    return { members, attendances };
  } catch (err) {
    console.error("Error fetching data:", err);
    setFetchError(t("serverError"));
    return { members: [], attendances: [] };
  } finally {
    setIsLoading(false);
  }
};
