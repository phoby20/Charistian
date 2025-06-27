type UserRole =
  | "MASTER"
  | "SUPER_ADMIN"
  | "SUB_ADMIN"
  | "ADMIN"
  | "GENERAL"
  | "CHECKER"
  | "VISITOR";

export type User = {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  address?: string;
  gender: string;
  birthDate: Date;
  profileImage?: string;
  country: string;
  churchId: string;
  groupId?: string;
  teamId?: string;
};
