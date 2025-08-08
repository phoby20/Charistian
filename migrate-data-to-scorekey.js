import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateData() {
  try {
    // 모든 Creation 데이터를 조회 (fileUrl이 비어있지 않고 key가 null이 아닌 경우)
    const creations = await prisma.creation.findMany({
      where: {
        fileUrl: { not: "" },
        key: { not: null },
      },
      select: {
        id: true,
        fileUrl: true,
        key: true,
      },
    });

    console.log(`마이그레이션 대상 Creation 수: ${creations.length}`);

    // 각 Creation에 대해 ScoreKey 데이터 생성
    for (const creation of creations) {
      if (creation.key && creation.fileUrl) {
        // ScoreKey에 이미 존재하는지 확인
        const existingScoreKey = await prisma.scoreKey.findFirst({
          where: {
            creationId: creation.id,
            key: creation.key,
          },
        });

        if (!existingScoreKey) {
          await prisma.scoreKey.create({
            data: {
              creationId: creation.id,
              key: creation.key,
              fileUrl: creation.fileUrl,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          console.log(
            `Creation ID ${creation.id}의 데이터가 ScoreKey로 마이그레이션되었습니다.`
          );
        } else {
          console.log(
            `Creation ID ${creation.id}의 데이터는 이미 ScoreKey에 존재하여 스킵되었습니다.`
          );
        }
      } else {
        console.warn(
          `Creation ID ${creation.id}는 key 또는 fileUrl이 누락되어 스킵되었습니다.`
        );
      }
    }

    console.log("데이터 마이그레이션이 완료되었습니다.");
  } catch (error) {
    console.error("마이그레이션 중 오류 발생:", error);
    throw error; // Vercel 빌드 실패로 처리
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
