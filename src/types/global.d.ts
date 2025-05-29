// types/global.d.ts
// Prisma 클라이언트를 전역 변수로 선언하여 싱글톤 패턴을 구현
/* eslint-disable no-var */
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}
