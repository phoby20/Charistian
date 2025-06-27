import { User as PrismaUser, Role } from "@prisma/client";

export interface Position {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
}

export interface SubGroup {
  id: string;
  name: string;
  groupId: string;
}

export interface Duty {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface CustomUser
  extends Omit<PrismaUser, "position" | "birthDate" | "createdAt"> {
  position: Position | null;
  birthDate: string;
  role: Role;
  createdAt: string;
  group: Group | null;
  subGroup: SubGroup | null;
  duties: Duty[];
  teams: Team[];
  profileImage: string | null; // 프로필 사진 필드
  positionId: string | null; // positionId 추가
}

export interface UserFormData
  extends Omit<
    CustomUser,
    "birthDate" | "group" | "subGroup" | "duties" | "teams"
  > {
  birthDate: string;
  groupId: string | null;
  subGroupId: string | null;
  dutyIds: string[];
  teamIds: string[];
  role: Role;
  profileImage: string | null;
}
