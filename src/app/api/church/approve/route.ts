import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 기본 직분 및 직책 데이터
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

    // 트랜잭션으로 Church, User, ChurchPosition, Duty 생성 및 Application 업데이트
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
            churchId: church.id,
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

        // 5. ChurchApplication 상태 업데이트
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
    }

    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
