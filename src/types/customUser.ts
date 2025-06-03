// src/type/customUser.ts
import { User as PrismaUser } from "@prisma/client";

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

export interface User
  extends Omit<PrismaUser, "position" | "birthDate" | "createdAt"> {
  position: Position | null;
  birthDate: string;
  createdAt: string;
  group: Group | null;
  subGroup: SubGroup | null;
  duties: Duty[] | null;
}

export interface FormData
  extends Omit<User, "birthDate" | "group" | "subGroup" | "duties"> {
  birthDate: string;
  groupId: string | null;
  subGroupId: string | null;
  dutyIds: string[];
}
