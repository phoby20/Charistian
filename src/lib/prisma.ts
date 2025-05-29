// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

// 애플리케이션 종료 시 연결 해제
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
