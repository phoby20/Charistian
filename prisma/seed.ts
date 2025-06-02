import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const defaultPositions = [
    "목사(牧師)",
    "전도사(伝道師)",
    "집사(執事)",
    "권사(勸士)",
    "장로(長老)",
    "원로목사(元老牧師)",
    "원로장로(元老長老)",
    "원로권사(元老勸士)",
    "안수집사(按手執事)",
    "일반(一般)",
  ];

  const defaultDuties = [
    "초등부 찬양팀 리더(小学部 賛美チーム リーダー)",
    "중등부 찬양팀 리더(中学部 賛美チーム リーダー)",
    "고등부 찬양팀 리더(高校部 賛美チーム リーダー)",
    "청년부 찬양팀 리더(青年部 賛美チーム リーダー)",
    "교회학교 교장(教会学校 校長)",
    "교회학교 교감(教会学校 副校長)",
    "교회학교 교사(教会学校 教師)",
    "청년부 회장(青年部 会長)",
    "청년부 부회장(青年部 副会長)",
    "청년부 서기(青年部 書記)",
    "청년부 회계(青年部 会計)",
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
