import { ChurchApplication, User } from "@prisma/client";
import { format, subDays } from "date-fns";
import { Dispatch, SetStateAction } from "react";

interface AttendanceRecord {
  userId: string;
  date: string;
}

export interface MemberStatsData {
  totalMembers: number;
  roleDistribution: { [role: string]: number };
  recentMembers: User[];
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
  t: (key: string, values?: Record<string, string | number | Date>) => string // 번역 함수 타입 명시
) => {
  if (!user || isLoading) return;

  try {
    // Fetch pending data
    const pendingResponse = await fetch("/api/pending", {
      credentials: "include",
    });
    if (!pendingResponse.ok) throw new Error("Failed to fetch pending data");
    const {
      pendingChurches,
      pendingUsers,
    }: { pendingChurches: ChurchApplication[]; pendingUsers: User[] } =
      await pendingResponse.json();
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

    // Fetch attendance stats (SUPER_ADMIN, ADMIN only)
    if (["SUPER_ADMIN", "ADMIN"].includes(user.role) && user.churchId) {
      const today = new Date();
      const startDate = subDays(today, 7).toISOString().split("T")[0];
      const endDate = today.toISOString().split("T")[0];

      const attendanceResponse = await fetch(
        `/api/attendance/search?startDate=${startDate}&endDate=${endDate}`,
        { credentials: "include" }
      );
      if (!attendanceResponse.ok) throw new Error("Failed to fetch attendance");
      const { attendances }: { attendances: AttendanceRecord[] } =
        await attendanceResponse.json();

      // Today’s attendance count
      const todayCount = attendances.filter(
        (att) => att.date === endDate
      ).length;

      // Weekly attendance rate
      const weekAttendees = new Set(attendances.map((att) => att.userId)).size;
      const weekRate =
        memberStats.totalMembers > 0
          ? (weekAttendees / memberStats.totalMembers) * 100
          : 0;

      // Last 7 days trend
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(today, 6 - i);
        return {
          date: format(date, "yyyy-MM-dd"),
          count: attendances.filter(
            (att) => att.date === format(date, "yyyy-MM-dd")
          ).length,
        };
      });

      setAttendanceStats({ todayCount, weekRate, last7Days });
    }

    // Fetch member stats
    if (["MASTER", "SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      const membersResponse = await fetch("/api/members", {
        credentials: "include",
      });
      if (!membersResponse.ok) throw new Error("Failed to fetch members");
      const { members }: { members: User[] } = await membersResponse.json();

      const filteredMembers = user.churchId
        ? members.filter((m: User) => m.churchId === user.churchId)
        : members;

      const totalMembers = filteredMembers.length;
      const roleDistribution = filteredMembers.reduce(
        (acc: { [role: string]: number }, m: User) => {
          acc[m.role] = (acc[m.role] || 0) + 1;
          return acc;
        },
        {}
      );
      const recentMembers = filteredMembers
        .sort(
          (a: User, b: User) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5);

      setMemberStats({ totalMembers, roleDistribution, recentMembers });
    }
  } catch (err) {
    console.error("Error fetching data:", err);
    setFetchError(t("serverError"));
  }
};
