// src/app/hooks/useUserDetailData.ts
import { useState, useEffect } from "react";
import { Position, Group, SubGroup, Duty, Team } from "@/types/customUser";

interface UserDetailData {
  positions: Position[];
  groups: Group[];
  subGroups: SubGroup[];
  duties: Duty[];
  teams: Team[];
  isLoading: boolean;
  error: string | null;
}

export function useUserDetailData(
  churchId: string,
  groupId: string | null
): UserDetailData {
  const [positions, setPositions] = useState<Position[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [subGroups, setSubGroups] = useState<SubGroup[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!churchId) {
        setError("교회 ID가 제공되지 않았습니다.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [posResponse, groupResponse, dutyResponse, teamResponse] =
          await Promise.all([
            fetch("/api/positions"),
            fetch(`/api/groups/public?churchId=${churchId}`),
            fetch(`/api/duties/public?churchId=${churchId}`),
            fetch(`/api/teams?churchId=${churchId}`),
          ]);

        if (!posResponse.ok)
          throw new Error("직책 정보를 가져오지 못했습니다.");
        if (!groupResponse.ok)
          throw new Error("그룹 정보를 가져오지 못했습니다.");
        if (!dutyResponse.ok) {
          const errorData = await dutyResponse.json();
          throw new Error(
            errorData.message || "직무 정보를 가져오지 못했습니다."
          );
        }
        if (!teamResponse.ok) throw new Error("팀 정보를 가져오지 못했습니다.");

        const [{ positions }, { groups }, { duties }, { teams: fetchedTeams }] =
          await Promise.all([
            posResponse.json(),
            groupResponse.json(),
            dutyResponse.json(),
            teamResponse.json(),
          ]);

        setPositions(positions);
        setGroups(groups);
        setDuties(duties);
        setTeams(fetchedTeams);

        if (groupId) {
          const subGroupResponse = await fetch(
            `/api/subGroups?groupId=${groupId}&churchId=${churchId}`
          );
          if (!subGroupResponse.ok)
            throw new Error("하위 그룹 정보를 가져오지 못했습니다.");
          const { subGroups } = await subGroupResponse.json();
          setSubGroups(subGroups);
        }
      } catch (err) {
        console.error("데이터 가져오기 오류:", err);
        setError(
          err instanceof Error
            ? err.message
            : "데이터를 가져오는 데 실패했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [churchId, groupId]);

  return { positions, groups, subGroups, duties, teams, isLoading, error };
}
