import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 기본 직분, 직책, 그룹, 팀, 서브그룹 데이터
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
  "교육팀(教育팀)",
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

// SubGroupInput 인터페이스 정의
interface SubGroupInput {
  name: string;
}

export async function POST(req: NextRequest) {
  try {
    const { applicationId } = await req.json();

    // 입력 검증
    if (!applicationId) {
      return NextResponse.json(
        { error: "신청 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // ChurchApplication 조회
    const application = await prisma.churchApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json(
        { error: "교회 신청서를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (application.state !== "PENDING") {
      return NextResponse.json(
        { error: "신청서가 대기 상태가 아닙니다" },
        { status: 400 }
      );
    }

    // 트랜잭션으로 Church, User, ChurchPosition, Duty, Group, SubGroup, Team 생성 및 Application 업데이트
    const [church, user, updatedApplication] = await prisma.$transaction(
      async (tx) => {
        // 1. 교회 생성
        const church = await tx.church.create({
          data: {
            name: application.churchName,
            address: application.address,
            country: application.country,
            city: application.city,
            region: application.region,
            phone: application.churchPhone,
            buildingImage: application.buildingImage,
            plan: application.plan,
            state: "APPROVED",
          },
        });

        // 2. 사용자 생성
        const user = await tx.user.create({
          data: {
            email: application.superAdminEmail.toLowerCase(),
            password: application.password,
            name: application.contactName,
            birthDate: application.contactBirthDate,
            phone: application.contactPhone,
            country: application.country,
            region: "Unknown",
            gender: application.contactGender,
            profileImage: application.contactImage,
            role: "SUPER_ADMIN",
            state: "APPROVED",
            church: {
              connect: { id: church.id },
            },
          },
        });

        // 3. 기본 직분(ChurchPosition) 생성
        const positionData = defaultPositions.map((name) => ({
          name,
          churchId: church.id,
        }));
        await tx.churchPosition.createMany({
          data: positionData,
        });

        // 4. 기본 직책(Duty) 생성
        const dutyData = defaultDuties.map((name) => ({
          name,
          churchId: church.id,
        }));
        await tx.duty.createMany({
          data: dutyData,
        });

        // 5. 기본 그룹(Group) 및 서브그룹(SubGroup) 생성
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

        // Group을 개별적으로 생성하여 id를 얻음
        for (const name of defaultGroups) {
          const group = await tx.group.create({
            data: {
              name,
              churchId: church.id,
            },
          });

          // SubGroup 생성
          const subGroups: SubGroupInput[] = classGroupNames.includes(name)
            ? classSubGroups.map((subGroupName) => ({ name: subGroupName }))
            : districtGroupNames.includes(name)
            ? districtSubGroups.map((subGroupName) => ({ name: subGroupName }))
            : [];

          if (subGroups.length > 0) {
            await tx.subGroup.createMany({
              data: subGroups.map((subGroup) => ({
                name: subGroup.name,
                groupId: group.id,
                churchId: church.id,
              })),
            });
          }
        }

        // 6. 기본 팀(Team) 생성
        const teamData = defaultTeams.map((name) => ({
          name,
          churchId: church.id,
        }));
        await tx.team.createMany({
          data: teamData,
        });

        // 7. ChurchApplication 상태 업데이트
        const updatedApplication = await tx.churchApplication.update({
          where: { id: applicationId },
          data: { state: "APPROVED" },
        });

        return [church, user, updatedApplication];
      }
    );

    // TODO: 이메일 전송 및 Stripe 결제 URL 생성 구현
    return NextResponse.json(
      {
        message: "교회 신청이 승인되었습니다",
        church,
        user,
        updatedApplication,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("교회 신청 승인 중 오류:", error);

    // Prisma 오류 처리
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "교회 신청서를 찾을 수 없습니다" },
          { status: 404 }
        );
      }
      if (error.code === "P2003") {
        return NextResponse.json(
          { error: "유효하지 않은 교회 ID입니다" },
          { status: 400 }
        );
      }
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "중복된 데이터가 존재합니다" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
