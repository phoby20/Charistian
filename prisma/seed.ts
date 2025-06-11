import { PrismaClient, Prisma, Role, Plan, ChurchState } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: 5000,
    timeout: 10000,
  },
});

interface SubGroupInput {
  name: string;
  church: { connect: { id: string } };
}

interface UserInput {
  email: string;
  password: string;
  name: string;
  birthDate: Date;
  gender: string;
  country: string;
  city: string;
  region: string;
  role: Role;
  positionName: string;
}

interface ChurchInput {
  name: string;
  address: string;
  city: string;
  region: string;
  country: string;
  phone: string;
  plan: Plan;
  state: ChurchState;
  users: UserInput[];
  defaultPositions: string[];
  defaultDuties: string[];
  defaultGroups: string[];
  defaultTeams: string[];
  classSubGroups: string[];
  districtSubGroups: string[];
}

async function seedChurch(
  tx: Prisma.TransactionClient,
  churchData: ChurchInput
) {
  // Church 존재 여부 확인
  const existingChurch = await tx.church.findFirst({
    where: { name: churchData.name },
  });

  if (existingChurch) {
    console.log(`"${churchData.name}" 교회가 이미 존재합니다. 건너뛰기.`);
    return;
  }

  // Church 생성
  const church = await tx.church.create({
    data: {
      name: churchData.name,
      address: churchData.address,
      city: churchData.city,
      region: churchData.region,
      country: churchData.country,
      phone: churchData.phone,
      plan: churchData.plan,
      state: churchData.state,
    },
  });

  // ChurchPosition 생성 및 매핑
  const positionMap = new Map<string, string>();
  for (const positionName of churchData.defaultPositions) {
    const position = await tx.churchPosition.create({
      data: {
        name: positionName,
        church: { connect: { id: church.id } },
      },
    });
    positionMap.set(positionName, position.id);
  }

  // 사용자 생성
  for (const userData of churchData.users) {
    const existingUser = await tx.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log(`사용자 "${userData.email}"가 이미 존재합니다. 건너뛰기.`);
      continue;
    }

    await tx.user.create({
      data: {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        birthDate: userData.birthDate,
        gender: userData.gender,
        country: userData.country,
        city: userData.city,
        region: userData.region,
        role: userData.role,
        position: positionMap.get(userData.positionName) || undefined,
        church: {
          connect: { id: church.id },
        },
      },
    });
  }

  // Church에 연결된 데이터 생성
  await tx.church.update({
    where: { id: church.id },
    data: {
      duties: {
        create: churchData.defaultDuties.map((name) => ({ name })),
      },
      groups: {
        create: churchData.defaultGroups.map((name) => {
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
            ? churchData.classSubGroups.map((subGroupName) => ({
                name: subGroupName,
                church: { connect: { id: church.id } },
              }))
            : districtGroupNames.includes(name)
            ? churchData.districtSubGroups.map((subGroupName) => ({
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
        create: churchData.defaultTeams.map((name) => ({ name })),
      },
    },
  });

  console.log(
    `"${churchData.name}" 교회의 시드 데이터가 성공적으로 삽입되었습니다.`
  );
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
    const hashedMasterPassword = await bcrypt.hash("master@charistian", 10);
    const hashedUserPassword = await bcrypt.hash("user", 10);

    // 교회 및 사용자 데이터 정의
    const churches: ChurchInput[] = [
      {
        name: "Master Church",
        address: "Master Address",
        city: "Seoul",
        region: "Gangnam",
        country: "Korea",
        phone: "000-0000-0000",
        plan: Plan.ENTERPRISE,
        state: ChurchState.APPROVED,
        users: [
          {
            email: "master@example.com",
            password: hashedMasterPassword,
            name: "Master Admin",
            birthDate: new Date("1970-01-01"),
            gender: "Male",
            country: "South Korea",
            city: "Seoul",
            region: "Gangnam",
            role: Role.MASTER,
            positionName: "목사(牧師)",
          },
        ],
        defaultPositions,
        defaultDuties,
        defaultGroups,
        defaultTeams,
        classSubGroups,
        districtSubGroups,
      },
      {
        name: "Hoge Test Church",
        address: "Hoge Test Address",
        city: "Tokyo",
        region: "Itabashi",
        country: "Japan",
        phone: "0312345678",
        plan: Plan.ENTERPRISE,
        state: ChurchState.APPROVED,
        users: [
          {
            email: "hoge_user1@hogetestchurch.com",
            password: hashedUserPassword,
            name: "Hoge Test User1",
            birthDate: new Date("1970-01-01"),
            gender: "Male",
            country: "Japan",
            city: "Tokyo",
            region: "Itabashi",
            role: Role.SUPER_ADMIN,
            positionName: "목사(牧師)",
          },
          {
            email: "hoge_user2@hogetestchurch.com",
            password: hashedUserPassword,
            name: "Hoge Test User2",
            birthDate: new Date("1970-01-01"),
            gender: "Female",
            country: "Japan",
            city: "Tokyo",
            region: "Suginami",
            role: Role.ADMIN,
            positionName: "전도사(伝道師)",
          },
          {
            email: "hoge_user3@hogetestchurch.com",
            password: hashedUserPassword,
            name: "Hoge Test User3",
            birthDate: new Date("1970-01-01"),
            gender: "Male",
            country: "Japan",
            city: "Tokyo",
            region: "Meguro",
            role: Role.ADMIN,
            positionName: "전도사(伝道師)",
          },
          {
            email: "hoge_user4@hogetestchurch.com",
            password: hashedUserPassword,
            name: "Hoge Test User4",
            birthDate: new Date("1970-01-01"),
            gender: "Female",
            country: "Japan",
            city: "Tokyo",
            region: "Bunkyo",
            role: Role.SUB_ADMIN,
            positionName: "집사(執事)",
          },
          {
            email: "hoge_user5@hogetestchurch.com",
            password: hashedUserPassword,
            name: "Hoge Test User5",
            birthDate: new Date("1970-01-01"),
            gender: "Male",
            country: "Japan",
            city: "Tokyo",
            region: "Nerima",
            role: Role.GENERAL,
            positionName: "집사(執事)",
          },
          {
            email: "hoge_user6@hogetestchurch.com",
            password: hashedUserPassword,
            name: "Hoge Test User6",
            birthDate: new Date("1970-01-01"),
            gender: "Female",
            country: "Japan",
            city: "Tokyo",
            region: "Edogawa",
            role: Role.GENERAL,
            positionName: "집사(執事)",
          },
          {
            email: "hoge_user7@hogetestchurch.com",
            password: hashedUserPassword,
            name: "Hoge Test User7",
            birthDate: new Date("1970-01-01"),
            gender: "Male",
            country: "Japan",
            city: "Tokyo",
            region: "Koto",
            role: Role.GENERAL,
            positionName: "장로(長老)",
          },
          {
            email: "hoge_user8@hogetestchurch.com",
            password: hashedUserPassword,
            name: "Hoge Test User8",
            birthDate: new Date("1970-01-01"),
            gender: "Female",
            country: "Japan",
            city: "Tokyo",
            region: "Suginami",
            role: Role.GENERAL,
            positionName: "안수집사(按手執事)",
          },
          {
            email: "hoge_user9@hogetestchurch.com",
            password: hashedUserPassword,
            name: "Hoge Test User9",
            birthDate: new Date("1970-01-01"),
            gender: "Male",
            country: "Japan",
            city: "Tokyo",
            region: "Chiyoda",
            role: Role.GENERAL,
            positionName: "일반(一般)",
          },
          {
            email: "hoge_user10@hogetestchurch.com",
            password: hashedUserPassword,
            name: "Hoge Test User10",
            birthDate: new Date("1970-01-01"),
            gender: "Female",
            country: "Japan",
            city: "Tokyo",
            region: "Kita",
            role: Role.GENERAL,
            positionName: "일반(一般)",
          },
        ],
        defaultPositions,
        defaultDuties,
        defaultGroups,
        defaultTeams,
        classSubGroups,
        districtSubGroups,
      },
      {
        name: "Fuga Test Church",
        address: "Fuga Test Address",
        city: "Seoul",
        region: "Yeongdeungpo",
        country: "Korea",
        phone: "0212345678",
        plan: Plan.SMART,
        state: ChurchState.APPROVED,
        users: [
          {
            email: "fuga_user1@fugatestchurch.com", // 오타 수정
            password: hashedUserPassword,
            name: "Fuga Test User1",
            birthDate: new Date("1970-01-01"),
            gender: "Male",
            country: "Korea",
            city: "Seoul",
            region: "Gangnam",
            role: Role.SUPER_ADMIN,
            positionName: "목사(牧師)",
          },
          {
            email: "fuga_user2@fugatestchurch.com",
            password: hashedUserPassword,
            name: "Fuga Test User2",
            birthDate: new Date("1970-01-01"), // 구문 오류 수정
            gender: "Female",
            country: "Korea",
            city: "Seoul",
            region: "Seocho", // region 수정
            role: Role.ADMIN,
            positionName: "전도사(伝道師)",
          },
          {
            email: "fuga_user3@fugatestchurch.com",
            password: hashedUserPassword,
            name: "Fuga Test User3", // 이름 수정
            birthDate: new Date("1970-01-01"), // 구문 오류 수정
            gender: "Male",
            country: "Korea",
            city: "Seoul",
            region: "Songpa", // region 및 positionName 수정
            role: Role.ADMIN,
            positionName: "전도사(伝道師)",
          },
          {
            email: "fuga_user4@fugatestchurch.com",
            password: hashedUserPassword,
            name: "Fuga Test User4",
            birthDate: new Date("1970-01-01"),
            gender: "Female",
            country: "Korea",
            city: "Seoul",
            region: "Gangbuk",
            role: Role.SUB_ADMIN,
            positionName: "집사(執事)",
          },
          {
            email: "fuga_user5@fugatestchurch.com",
            password: hashedUserPassword,
            name: "Fuga Test User5",
            birthDate: new Date("1970-01-01"),
            gender: "Male",
            country: "Korea",
            city: "Seoul",
            region: "Gwanak",
            role: Role.GENERAL,
            positionName: "집사(執事)",
          },
          {
            email: "fuga_user6@fugatestchurch.com",
            password: hashedUserPassword,
            name: "Fuga Test User6",
            birthDate: new Date("1970-01-01"),
            gender: "Female",
            country: "Korea",
            city: "Seoul",
            region: "Guro",
            role: Role.GENERAL,
            positionName: "집사(執事)",
          },
          {
            email: "fuga_user7@fugatestchurch.com",
            password: hashedUserPassword,
            name: "Fuga Test User7",
            birthDate: new Date("1970-01-01"),
            gender: "Male",
            country: "Korea",
            city: "Seoul",
            region: "Yeongdeungpo",
            role: Role.GENERAL,
            positionName: "장로(長老)",
          },
          {
            email: "fuga_user8@fugatestchurch.com",
            password: hashedUserPassword,
            name: "Fuga Test User8",
            birthDate: new Date("1970-01-01"),
            gender: "Male",
            country: "Korea",
            city: "Seoul",
            region: "Jongno",
            role: Role.GENERAL,
            positionName: "안수집사(按手執事)",
          },
          {
            email: "fuga_user9@fugatestchurch.com",
            password: hashedUserPassword,
            name: "Fuga Test User9",
            birthDate: new Date("1970-01-01"),
            gender: "Male",
            country: "Korea",
            city: "Seoul",
            region: "Dongjak",
            role: Role.GENERAL,
            positionName: "일반(一般)",
          },
          {
            email: "fuga_user10@fugatestchurch.com",
            password: hashedUserPassword,
            name: "Fuga Test User10",
            birthDate: new Date("1970-01-01"),
            gender: "Male",
            country: "Korea",
            city: "Seoul",
            region: "Dongdaemun",
            role: Role.GENERAL,
            positionName: "일반(一般)",
          },
        ],
        defaultPositions,
        defaultDuties,
        defaultGroups,
        defaultTeams,
        classSubGroups,
        districtSubGroups,
      },
    ];

    // 각 교회별로 별도 트랜잭션 실행
    for (const churchData of churches) {
      await prisma.$transaction(async (tx) => {
        await seedChurch(tx, churchData);
      });
    }
  } catch (error) {
    console.error("시드 데이터 삽입 실패:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("메인 에러:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Prisma 클라이언트 연결 해제.");
  });
