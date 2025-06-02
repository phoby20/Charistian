import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const defaultPositions = [
    "Pastor",
    "Evangelist",
    "Deacon",
    "Elder Woman",
    "Elder Man",
    "Ordained Deacon",
    "Senior Elder",
    "Senior Elder Woman",
    "Senior Pastor",
    "Congregant",
  ];

  const defaultDuties = [
    "Worship Team Leader",
    "Media Team Leader",
    "President", // 회장
    "Vice President", // 부회장
    "Secretary", // 서기
    "Treasurer", // 회계
  ];

  try {
    const hashedPassword = await bcrypt.hash("master@christm", 10);

    // 트랜잭션으로 데이터 생성
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email: "master@example.com" },
        update: {},
        create: {
          email: "master@example.com",
          password: hashedPassword,
          name: "Master Admin",
          birthDate: new Date("1970-01-01"),
          gender: "M",
          country: "South Korea",
          city: "Seoul",
          region: "Gangnam",
          role: "MASTER",
          church: {
            create: {
              name: "Master Church",
              address: "Master Address",
              city: "Seoul",
              region: "Gangnam",
              country: "Korea",
              phone: "000-0000-0000",
              plan: "ENTERPRISE",
              state: "APPROVED",
              positions: {
                create: defaultPositions.map((name) => ({ name })), // ChurchPosition 레코드 생성
              },
              duties: {
                create: defaultDuties.map((name) => ({ name })), // Duty 레코드 생성
              },
            },
          },
        },
      });

      console.log("Seed data inserted successfully.", user);
    });
  } catch (error) {
    console.error("Seeding failed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("Main error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Prisma client disconnected.");
  });
