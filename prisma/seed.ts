import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

interface SubGroupInput {
  name: string;
  church: { connect: { id: string } };
}

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

  const defaultGroups = [
    "유아부(幼兒部)",
    "유치부(幼稚部)",
    "초등부(小学部)",
    "중등부(中学部)",
    "고등부(高校部)",
    "중고등부(中高等部)",
    "청년부(青年部)",
    "청장년부(靑長年部)",
    "대학부(大學部)",
    "장년부(長年部)",
    "여성부(女性部)",
    "남성부(男性部)",
    "선교부(宣敎部)",
    "청소년부(靑少年部)",
    "무소속(無所属)",
  ];

  const defaultTeams = [
    "찬양팀(賛美チーム)",
    "기도팀(祈禱チーム)",
    "봉사팀(奉仕チーム)",
    "행정팀(行政チーム)",
    "재정팀(財政チーム)",
    "교육팀(教育チーム)",
    "문화팀(文化チーム)",
    "홍보팀(広報チーム)",
    "사회봉사팀(社會奉仕チーム)",
    "예배팀(礼拜チーム)",
    "성경공부팀(聖經勉強チーム)",
    "사역팀(事業チーム)",
    "행사팀(行事チーム)",
    "기획팀(企劃チーム)",
    "음악팀(音樂チーム)",
    "미디어팀(メディアチーム)",
  ];

  const classSubGroups = ["1반", "2반", "3반"];
  const districtSubGroups = ["1교구(1教区)", "2교구(2教区)", "3교구(3教区)"];

  try {
    const hashedPassword = await bcrypt.hash("master@charistian", 10);

    // 트랜잭션으로 데이터 생성
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // User 존재 여부 확인
      const existingUser = await tx.user.findUnique({
        where: { email: "master@example.com" },
        select: { id: true, churchId: true }, // churchId 포함
      });

      if (existingUser) {
        // User가 존재하면 churchId로 Church 확인
        if (existingUser.churchId) {
          const existingChurch = await tx.church.findUnique({
            where: { id: existingUser.churchId },
          });

          if (existingChurch) {
            throw new Error(
              `Church with ID "${existingUser.churchId}" already exists for user with email "master@example.com". Seeding aborted.`
            );
          }
        }
        // churchId가 없더라도 User가 존재하면 시드 중단
        throw new Error(
          `User with email "master@example.com" already exists. Seeding aborted.`
        );
      }

      // Church 생성
      const church = await tx.church.create({
        data: {
          name: "Master Church",
          address: "Master Address",
          city: "Seoul",
          region: "Gangnam",
          country: "Korea",
          phone: "000-0000-0000",
          plan: "ENTERPRISE",
          state: "APPROVED",
        },
      });

      // User 생성
      const user = await tx.user.create({
        data: {
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
            connect: { id: church.id },
          },
        },
      });

      // Church에 연결된 데이터 생성
      await tx.church.update({
        where: { id: church.id },
        data: {
          positions: {
            create: defaultPositions.map((name) => ({ name })),
          },
          duties: {
            create: defaultDuties.map((name) => ({ name })),
          },
          groups: {
            create: defaultGroups.map((name) => {
              const classGroupNames = [
                "유아부(幼兒部)",
                "유치부(幼稚部)",
                "초등부(小学部)",
                "중등부(中学部)",
                "고등부(高校部)",
                "중고등부(中高等部)",
              ];
              const districtGroupNames = [
                "청년부(青年部)",
                "청장년부(靑長年部)",
                "대학부(大學部)",
                "장년부(長年部)",
              ];

              const subGroups: SubGroupInput[] = classGroupNames.includes(name)
                ? classSubGroups.map((subGroupName) => ({
                    name: subGroupName,
                    church: { connect: { id: church.id } },
                  }))
                : districtGroupNames.includes(name)
                ? districtSubGroups.map((subGroupName) => ({
                    name: subGroupName,
                    church: { connect: { id: church.id } },
                  }))
                : [];

              return {
                name,
                subGroups: {
                  create: subGroups,
                },
              };
            }),
          },
          teams: {
            create: defaultTeams.map((name) => ({ name })),
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
