// src/app/[locale]/dashboard/index.ts
import { getKoreaDate } from "@/utils/creatKoreaDate";
import { ChurchApplication, User } from "@prisma/client";
import { format, subDays } from "date-fns";
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
  memberStats: MemberStatsData,
  setPendingChurches: Dispatch<SetStateAction<ChurchApplication[]>>,
  setPendingUsers: Dispatch<SetStateAction<User[]>>,
  setAttendanceStats: Dispatch<SetStateAction<AttendanceStatsData>>,
  setMemberStats: Dispatch<SetStateAction<MemberStatsData>>,
  setFetchError: Dispatch<SetStateAction<string | null>>,
  setIsLoading: Dispatch<SetStateAction<boolean>>,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  selectedGroups: string[],
  selectedSubGroups: string[],
  selectedTeams: string[]
) => {
  if (!user || isLoading) return;
  setIsLoading(true);
  try {
    // Fetch pending data
    const pendingResponse = await fetch("/api/pending", {
      credentials: "include",
    });

    if (!pendingResponse.ok) throw new Error("Failed to fetch pending data");
    const {
      pendingChurches,
      pendingUsers,
    }: {
      pendingChurches: ChurchApplication[];
      pendingUsers: User[];
    } = await pendingResponse.json();
    setPendingChurches(pendingChurches);

    if (["MASTER", "SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      if (user.churchId) {
        const filteredUsers = pendingUsers.filter(
          (userData: User) => userData.churchId === user.churchId
        );
        setPendingUsers(filteredUsers);
      } else {
        setPendingUsers([]);
      }
    } else {
      setPendingUsers([]);
    }

    // Fetch all members
    const membersResponse = await fetch("/api/members", {
      credentials: "include",
    });

    if (!membersResponse.ok) throw new Error("Failed to fetch members");
    const { members }: { members: UserWithRelations[] } =
      await membersResponse.json();

    // 필터링된 멤버 목록
    const filteredMembers = members.filter((m: UserWithRelations) => {
      const inSelectedGroups =
        selectedGroups.length === 0 ||
        m.groups.some((g) => selectedGroups.includes(g.name));
      const inSelectedSubGroups =
        selectedSubGroups.length === 0 ||
        m.subGroups.some((sg) => selectedSubGroups.includes(sg.name));
      const inSelectedTeams =
        selectedTeams.length === 0 ||
        m.teams.some((t) => selectedTeams.includes(t.name));
      return (
        inSelectedGroups &&
        inSelectedSubGroups &&
        inSelectedTeams &&
        m.churchId === user.churchId
      );
    });

    // Member stats 계산
    const totalMembers = filteredMembers.length;
    const roleDistribution = filteredMembers.reduce(
      (acc: { [role: string]: number }, m: UserWithRelations) => {
        acc[m.role] = (acc[m.role] || 0) + 1;
        return acc;
      },
      {}
    );
    const recentMembers = filteredMembers
      .sort(
        (a: UserWithRelations, b: UserWithRelations) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);

    setMemberStats({ totalMembers, roleDistribution, recentMembers });

    // Fetch attendance stats (SUPER_ADMIN, ADMIN only)
    if (["SUPER_ADMIN", "ADMIN"].includes(user.role) && user.churchId) {
      const today = getKoreaDate();
      const startDate = subDays(today, 6).toISOString().split("T")[0];

      const attendanceResponse = await fetch(
        `/api/attendance/search?startDate=${startDate}&endDate=${today}`,
        { credentials: "include" }
      );

      if (!attendanceResponse.ok) throw new Error("Failed to fetch attendance");
      const { attendances }: { attendances: AttendanceRecord[] } =
        await attendanceResponse.json();

      // 필터링된 출석 기록
      const filteredAttendances = attendances.filter((att) =>
        filteredMembers.some((m) => m.id === att.userId)
      );

      // Today’s attendance count
      const todayCount = filteredAttendances.filter((att) => {
        const todayString = format(today, "yyyy-MM-dd");
        return att.date === todayString;
      }).length;

      // Weekly attendance rate
      const weekAttendees = new Set(
        filteredAttendances.map((att) => att.userId)
      ).size;
      const weekRate =
        totalMembers > 0 ? (weekAttendees / totalMembers) * 100 : 0;

      // Last 7 days trend
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(today, 6 - i);
        const dateString = format(date, "yyyy-MM-dd");
        return {
          date: dateString,
          count: filteredAttendances.filter((att) => att.date === dateString)
            .length,
        };
      });

      setAttendanceStats({ todayCount, weekRate, last7Days });
    } else {
      // 출석 데이터 페칭 조건 미충족 시 기본값 설정
      setAttendanceStats({ todayCount: 0, weekRate: 0, last7Days: [] });
    }
  } catch (err) {
    console.error("Error fetching data:", err);
    setFetchError(t("serverError"));
  } finally {
    setIsLoading(false);
  }
};
