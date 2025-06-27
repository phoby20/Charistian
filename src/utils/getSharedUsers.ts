// src/utils/user.ts
import prisma from "@/lib/prisma";

export async function getSharedUsers(
  groupIds: string[],
  teamIds: string[]
): Promise<Array<{ email: string; name: string }>> {
  return prisma.user.findMany({
    where: {
      AND: [
        { groups: { some: { id: { in: groupIds } } } },
        { teams: { some: { id: { in: teamIds } } } },
        { email: { not: "" } },
      ],
    },
    select: { email: true, name: true },
  });
}
