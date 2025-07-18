// src/app/api/scores/master/route.ts
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { TokenPayload, verifyToken } from "@/lib/jwt";
import { CreationType, Genre } from "@prisma/client";
import { createKoreaDate } from "@/utils/creatKoreaDate";
import { constants } from "@/constants/intex";

const { KEYS, TONES } = constants;

// 타입 가드를 위한 유틸리티 함수
const isValidKey = (value: string): value is (typeof KEYS)[number] =>
  KEYS.includes(value as (typeof KEYS)[number]);
const isValidTone = (value: string): value is (typeof TONES)[number] =>
  TONES.includes(value as (typeof TONES)[number]);

export async function POST(request: NextRequest) {
  console.log("api/scores/master start");
  try {
    // 토큰에서 사용자 정보 가져오기
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    let payload: TokenPayload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: `유효하지 않은 토큰입니다. ${error}` },
        { status: 401 }
      );
    }

    // MASTER 권한 확인
    if (payload.role !== "MASTER") {
      return NextResponse.json(
        { error: "MASTER 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const titleEn = formData.get("titleEn") as string | null;
    const titleJa = formData.get("titleJa") as string | null;
    const description = formData.get("description") as string | null;
    const tempo = formData.get("tempo") as string | null;
    const price = formData.get("price") as string | null;
    const key = formData.get("key") as string | null;
    const referenceUrlsRaw = formData.get("referenceUrls") as string;
    const lyrics = formData.get("lyrics") as string | null;
    const lyricsEn = formData.get("lyricsEn") as string | null;
    const lyricsJa = formData.get("lyricsJa") as string | null;
    const composer = formData.get("composer") as string | null;
    const lyricist = formData.get("lyricist") as string | null;
    const saleStartDate = formData.get("saleStartDate") as string | null;
    const saleEndDate = formData.get("saleEndDate") as string | null;
    const genre = formData.get("genre") as Genre | null;
    const isPublic = formData.get("isPublic") === "true";
    const isForSale = formData.get("isForSale") === "true";
    const isOriginal = formData.get("isOriginal") === "true";
    const churchId = formData.get("churchId") as string;

    // 필수 필드 검증
    if (!file || !title || !churchId || !key) {
      return NextResponse.json(
        { error: "필수 필드(file, title, churchId, key)를 입력해야 합니다." },
        { status: 400 }
      );
    }

    // 파일 형식 검증
    if (!["application/pdf"].includes(file.type)) {
      return NextResponse.json(
        { error: "PDF 파일만 업로드 가능합니다." },
        { status: 400 }
      );
    }

    // 자작곡이 아닌 경우 판매 불가
    if (isForSale && !isOriginal) {
      return NextResponse.json(
        { error: "자작곡이 아닌 악보는 판매할 수 없습니다." },
        { status: 400 }
      );
    }

    // 코드 키 유효성 검증
    const [keyNote, tone] = key.split(" ");
    if (!isValidKey(keyNote) || !isValidTone(tone)) {
      return NextResponse.json(
        { error: "유효하지 않은 코드 키입니다." },
        { status: 400 }
      );
    }

    // 교회 존재 여부 확인
    const church = await prisma.church.findUnique({
      where: { id: churchId },
    });
    if (!church) {
      return NextResponse.json(
        { error: "유효하지 않은 churchId입니다." },
        { status: 400 }
      );
    }

    // 한국 시간 기준 날짜 생성
    const koreaDate = createKoreaDate();

    // Vercel Blob에 파일 업로드
    const fileBlob = await put(
      `scores/${churchId}/${payload.userId}/${koreaDate}-${file.name}`,
      file,
      { access: "public", contentType: file.type }
    );

    // referenceUrls 파싱
    let referenceUrls: { url: string }[] = [];
    try {
      referenceUrls = JSON.parse(referenceUrlsRaw);
    } catch {
      return NextResponse.json(
        { error: "referenceUrls 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    // Creation 생성
    const creation = await prisma.creation.create({
      data: {
        title,
        titleEn: titleEn || undefined,
        titleJa: titleJa || undefined,
        description: description || undefined,
        type: isOriginal ? CreationType.ORIGINAL_SCORE : CreationType.SCORE,
        fileUrl: fileBlob.url,
        price: price ? parseFloat(price) : undefined,
        tempo: tempo ? parseInt(tempo) : undefined,
        key,
        referenceUrls: referenceUrls.map((item) => item.url),
        lyrics: lyrics || undefined,
        lyricsEn: lyricsEn || undefined,
        lyricsJa: lyricsJa || undefined,
        composer: composer || undefined,
        lyricist: lyricist || undefined,
        saleStartDate: saleStartDate ? new Date(saleStartDate) : undefined,
        saleEndDate: saleEndDate ? new Date(saleEndDate) : undefined,
        genre: genre || undefined,
        isPublic,
        isForSale,
        isOriginal,
        isOpen: true, // 기본값
        creatorId: payload.userId,
        churchId,
      },
    });

    return NextResponse.json({ id: creation.id }, { status: 201 });
  } catch (error) {
    console.error("악보 업로드 중 오류 발생:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
