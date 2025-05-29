import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma, Church, User, ChurchApplication } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { applicationId } = await req.json();

    // 입력 검증
    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    // ChurchApplication 조회
    const application = await prisma.churchApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Church application not found" },
        { status: 404 }
      );
    }

    if (application.state !== "PENDING") {
      return NextResponse.json(
        { error: "Application is not in PENDING state" },
        { status: 400 }
      );
    }

    // 트랜잭션으로 Church, User 생성 및 Application 업데이트
    const [church, user, updatedApplication] = (await prisma.$transaction([
      prisma.church.create({
        data: {
          name: application.churchName,
          address: application.address,
          country: application.country,
          phone: application.churchPhone,
          buildingImage: application.buildingImage,
          plan: application.plan,
          state: "APPROVED",
        },
      }),
      prisma.user.create({
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
        },
      }),
      prisma.churchApplication.update({
        where: { id: applicationId },
        data: { state: "APPROVED" },
      }),
    ])) as [Church, User, ChurchApplication];

    // TODO: 이메일 전송 및 Stripe 결제 URL 생성 구현
    return NextResponse.json(
      {
        message: "Church application approved",
        church,
        user,
        updatedApplication,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error approving church application:", error);

    // Prisma 오류 처리
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Church application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
