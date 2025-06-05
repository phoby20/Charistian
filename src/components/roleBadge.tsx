import { Role } from "@prisma/client";

// Role에 따른 border 색상 매핑
export const getBorderColor = (role: string) => {
  switch (role) {
    case Role.VISITOR:
      return (
        <p className="text-sm text-gray-100 px-3 rounded-full border bg-gray-500 border-gray-300">
          {role}
        </p>
      );
    case Role.GENERAL:
      return <></>;
    case Role.ADMIN:
      return (
        <p className="text-sm text-gray-100 px-3 rounded-full border bg-blue-500 border-blue-500">
          {role}
        </p>
      );
    case Role.SUB_ADMIN:
      return (
        <p className="text-sm text-gray-100 px-3 rounded-full border bg-indigo-500 border-indigo-500">
          {role}
        </p>
      );
    case Role.SUPER_ADMIN:
      return (
        <p className="text-sm text-gray-100 px-3 rounded-full border bg-purple-500 border-purple-500">
          {role}
        </p>
      );
    case Role.MASTER:
      return (
        <p className="text-sm text-gray-100 px-3 rounded-full border bg-red-500 border-red-500">
          {role}
        </p>
      );
    default:
      <></>;
  }
};
