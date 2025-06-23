import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadFile } from "@/lib/vercelBlob";
import * as bcrypt from "bcrypt";
import { regionsByCityKorea } from "@/data/regions/regionsKorea";
import { regionsByCityJapan } from "@/data/regions/regionsJapan";
import { Resend } from "resend";

const validPlans = ["FREE", "SMART", "ENTERPRISE"] as const;
type Plan = (typeof validPlans)[number];

type RegionMap = Record<string, { value: string; label: string }[]>;

function extractValidCities(data: RegionMap): string[] {
  const result: string[] = [];
  for (const [city, regions] of Object.entries(data)) {
    if (regions.length > 0) {
      result.push(city);
    }
  }
  return result;
}

type Region = {
  value: string;
  label: string;
};
function convertRegionsFormat(
  input: Record<string, Region[]>
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [city, regions] of Object.entries(input)) {
    if (regions.length === 0) continue;
    result[city] = regions.map((region) => region.value);
  }
  return result;
}

const validRegionsByCity: Record<string, string[]> = convertRegionsFormat({
  ...regionsByCityKorea,
  ...regionsByCityJapan,
});

const validCities: string[] = extractValidCities({
  ...regionsByCityKorea,
  ...regionsByCityJapan,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const data = {
      churchName: formData.get("churchName") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      region: formData.get("region") as string,
      country: formData.get("country") as string,
      churchPhone: formData.get("churchPhone") as string,
      superAdminEmail: formData.get("superAdminEmail") as string,
      password: formData.get("password") as string,
      contactName: formData.get("contactName") as string,
      contactPhone: formData.get("contactPhone") as string,
      contactGender: formData.get("contactGender") as string,
      contactBirthDate: undefined as Date | undefined,
      plan: formData.get("plan") as string,
      contactImage: undefined as string | undefined,
      buildingImage: undefined as string | undefined,
    };

    // 입력 검증
    const missingFields: string[] = [];
    const contactBirthDateRaw = formData.get("contactBirthDate") as string;
    if (!data.churchName) missingFields.push("churchName");
    if (!data.address) missingFields.push("address");
    if (!data.city) missingFields.push("city");
    if (!data.region) missingFields.push("region");
    if (!data.country) missingFields.push("country");
    if (!data.churchPhone) missingFields.push("churchPhone");
    if (!data.superAdminEmail) missingFields.push("superAdminEmail");
    if (!data.password) missingFields.push("password");
    if (!data.contactName) missingFields.push("contactName");
    if (!data.contactPhone) missingFields.push("contactPhone");
    if (!data.contactGender) missingFields.push("contactGender");
    if (
      !contactBirthDateRaw ||
      isNaN(new Date(contactBirthDateRaw).getTime())
    ) {
      missingFields.push("contactBirthDate (유효한 날짜 형식이 아닙니다)");
    }
    if (!data.plan) missingFields.push("plan");

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `누락된 필수 필드: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    data.contactBirthDate = new Date(contactBirthDateRaw);

    // Country 검증
    if (!["Korea", "Japan"].includes(data.country)) {
      return NextResponse.json(
        { error: "유효하지 않은 국가입니다." },
        { status: 400 }
      );
    }

    // City 검증
    if (!validCities.includes(data.city)) {
      return NextResponse.json(
        { error: "유효하지 않은 도시입니다." },
        { status: 400 }
      );
    }

    // Region 검증
    if (!validRegionsByCity[data.city]?.includes(data.region)) {
      return NextResponse.json(
        { error: "유효하지 않은 지역입니다." },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingApplication = await prisma.churchApplication.findFirst({
      where: { superAdminEmail: data.superAdminEmail },
    });
    const existingUser = await prisma.user.findUnique({
      where: { email: data.superAdminEmail },
    });
    if (existingApplication || existingUser) {
      return NextResponse.json(
        { error: "이미 등록된 이메일입니다." },
        { status: 400 }
      );
    }

    // Plan 검증
    if (!validPlans.includes(data.plan.toUpperCase() as Plan)) {
      return NextResponse.json(
        { error: "유효하지 않은 플랜입니다." },
        { status: 400 }
      );
    }
    const plan: Plan = data.plan.toUpperCase() as Plan;

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 파일 업로드
    const contactImage = formData.get("contactImage") as File;
    const buildingImage = formData.get("buildingImage") as File;

    if (contactImage && contactImage instanceof File && contactImage.size > 0) {
      try {
        data.contactImage = await uploadFile(
          contactImage,
          `contact_${data.contactName}_${Date.now()}.jpg`,
          "contact-images"
        );
      } catch (fileError) {
        console.error("Contact image upload failed:", fileError);
        return NextResponse.json(
          { error: "연락처 이미지 업로드 실패" },
          { status: 500 }
        );
      }
    }
    if (
      buildingImage &&
      buildingImage instanceof File &&
      buildingImage.size > 0
    ) {
      try {
        data.buildingImage = await uploadFile(
          buildingImage,
          `building_${data.churchName}_${Date.now()}.jpg`,
          "building-images"
        );
      } catch (fileError) {
        console.error("Building image upload failed:", fileError);
        return NextResponse.json(
          { error: "건물 이미지 업로드 실패" },
          { status: 500 }
        );
      }
    }

    // ChurchApplication 생성
    console.log("Creating ChurchApplication with data:", data);
    await prisma.churchApplication.create({
      data: {
        churchName: data.churchName,
        address: data.address,
        city: data.city,
        region: data.region,
        country: data.country,
        churchPhone: data.churchPhone,
        superAdminEmail: data.superAdminEmail.toLowerCase(),
        password: hashedPassword,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactGender: data.contactGender,
        contactBirthDate: data.contactBirthDate,
        plan,
        contactImage: data.contactImage,
        buildingImage: data.buildingImage,
        state: "PENDING",
      },
    });

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: `charistian 운영팀 <${process.env.RESEND_FROM}>`,
      to: `${process.env.ADMIN_EMAIL}`,
      subject: `교회 등록 신청 알림`,
      html: `
      <h2>${data.churchName} 교회 등록 신청</h2>
      <p>${data.churchName} 교회의 등록 신청이 있습니다.</p>
      <p>지금 <a href="https://www.charistian.com/">https://www.charistian.com/</a>에 마스터 권한으로 접속해서 확인하시기 바랍니다.</p>
    `,
    });

    return NextResponse.json(
      { message: "교회 등록 신청이 완료되었습니다." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering church application:", error);
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
        ...(isDev && { details: error }),
      },
      { status: 500 }
    );
  }
}
