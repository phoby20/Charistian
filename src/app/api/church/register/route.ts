import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadFile } from "@/lib/vercelBlob";
import * as bcrypt from "bcrypt";

const validPlans = ["FREE", "SMART", "ENTERPRISE"] as const;
type Plan = (typeof validPlans)[number];

const validCities = [
  "Seoul",
  "Busan",
  "Daegu",
  "Incheon",
  "Gwangju",
  "Daejeon",
  "Ulsan",
  "Suwon",
  "Jeju",
  "Goyang",
  "Changwon",
  "Seongnam",
  "Tokyo",
  "Osaka",
  "Kyoto",
  "Yokohama",
  "Nagoya",
  "Sapporo",
  "Fukuoka",
  "Kobe",
  "Hiroshima",
  "Sendai",
  "Chiba",
  "Kawasaki",
];

const validRegionsByCity: Record<string, string[]> = {
  Seoul: ["Gangnam", "Seocho", "Songpa"],
  Busan: ["Haeundae", "Suyeong", "Busanjin"],
  Daegu: ["Suseong", "Dalseo"],
  Incheon: ["Namdong", "Yeonsu"],
  Gwangju: ["Bukgu", "Gwangsan"],
  Daejeon: ["Yuseong", "Jung"],
  Ulsan: ["Namgu", "Jung"],
  Suwon: ["Yeongtong", "Paldal"],
  Jeju: ["JejuCity", "Seogwipo"],
  Goyang: ["Ilsanseo", "Deogyang"],
  Changwon: ["Seongsan", "Uichang"],
  Seongnam: ["Bundang", "Sujeong"],
  Tokyo: ["Shibuya", "Shinjuku", "Minato"],
  Osaka: ["Umeda", "Namba", "Kita"],
  Kyoto: ["Shimogyo", "Nakagyo"],
  Yokohama: ["Naka", "Minami"],
  Nagoya: ["Naka", "Higashi"],
  Sapporo: ["Chuo", "Kita"],
  Fukuoka: ["Hakata", "Chuo"],
  Kobe: ["Chuo", "Nada"],
  Hiroshima: ["Naka", "Minami"],
  Sendai: ["Aoba", "Miyagino"],
  Chiba: ["Chuo", "Mihama"],
  Kawasaki: ["Kawasaki", "Nakahara"],
};

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
      contactBirthDate: new Date(formData.get("contactBirthDate") as string),
      plan: formData.get("plan") as string,
      contactImage: undefined as string | undefined,
      buildingImage: undefined as string | undefined,
    };

    // 입력 검증
    if (
      !data.churchName ||
      !data.address ||
      !data.city ||
      !data.region ||
      !data.country ||
      !data.churchPhone ||
      !data.superAdminEmail ||
      !data.password ||
      !data.contactName ||
      !data.contactPhone ||
      !data.contactGender ||
      !data.contactBirthDate ||
      !data.plan
    ) {
      return NextResponse.json(
        { error: "모든 필수 필드를 입력해주세요." },
        { status: 400 }
      );
    }

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
    const plan: Plan = validPlans.includes(data.plan.toUpperCase() as Plan)
      ? (data.plan.toUpperCase() as Plan)
      : "FREE";

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 파일 업로드
    const contactImage = formData.get("contactImage") as File;
    const buildingImage = formData.get("buildingImage") as File;

    if (contactImage && contactImage.size > 0) {
      data.contactImage = await uploadFile(
        contactImage,
        `contact_${data.contactName}_${Date.now()}.jpg`
      );
    }
    if (buildingImage && buildingImage.size > 0) {
      data.buildingImage = await uploadFile(
        buildingImage,
        `building_${data.churchName}_${Date.now()}.jpg`
      );
    }

    // ChurchApplication 생성
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

    return NextResponse.json(
      { message: "교회 등록 신청이 완료되었습니다." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering church application:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
