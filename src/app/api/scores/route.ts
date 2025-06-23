// app/api/scores/route.ts
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { TokenPayload, verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { CreationType, Genre } from "@prisma/client";
import { allowedRoles } from "./allowedRoles";
import { createKoreaDate } from "@/utils/creatKoreaDate";

// 코드 키와 조 상수 정의
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const TONES = ["Major", "Minor"];

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "인증되지 않았습니다." },
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

  if (!allowedRoles.includes(payload.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const scores = await prisma.creation.findMany({
    where: {
      OR: [{ churchId: payload.churchId }, { isPublic: true }],
      type: { in: [CreationType.SCORE, CreationType.ORIGINAL_SCORE] },
      isOpen: true,
    },
    include: {
      creator: { select: { name: true } },
      likes: { where: { userId: payload.userId }, select: { id: true } },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(scores, { status: 200 });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "인증되지 않았습니다." },
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

  if (!allowedRoles.includes(payload.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const thumbnail = formData.get("thumbnail") as File | null;
  const title = formData.get("title") as string;
  const isPublic = formData.get("isPublic") === "true";
  const isForSale = formData.get("isForSale") === "true";
  const isOriginal = formData.get("isOriginal") === "true";
  const genre = formData.get("genre") as Genre;
  const key = formData.get("key") as string; // 추가: 코드 키

  // 필수 필드 검증
  if (!file) {
    return NextResponse.json(
      { error: "악보 파일은 필수입니다." },
      { status: 400 }
    );
  }
  if (!["image/jpeg", "application/pdf"].includes(file.type)) {
    return NextResponse.json(
      { error: "jpg 또는 pdf 파일만 업로드 가능합니다." },
      { status: 400 }
    );
  }
  if (isForSale && !isOriginal) {
    return NextResponse.json(
      { error: "자작곡이 아닌 악보는 판매할 수 없습니다." },
      { status: 400 }
    );
  }
  if (!key) {
    return NextResponse.json(
      { error: "코드 키는 필수입니다." },
      { status: 400 }
    );
  }
  // 코드 키 유효성 검증
  const [keyNote, tone] = key.split(" ");
  if (!KEYS.includes(keyNote) || !TONES.includes(tone)) {
    return NextResponse.json(
      { error: "유효하지 않은 코드 키입니다." },
      { status: 400 }
    );
  }

  const koreaDate = createKoreaDate();

  // Vercel Blob에 파일 업로드
  const fileBlob = await put(
    `scores/${payload.churchId}/${payload.userId}/${koreaDate}-${file.name}`,
    file,
    { access: "public", contentType: file.type }
  );

  let thumbnailBlob: { url: string } | undefined;
  if (thumbnail) {
    thumbnailBlob = await put(
      `thumbnails/${payload.churchId}/${payload.userId}/${koreaDate}-${thumbnail.name}`,
      thumbnail,
      { access: "public", contentType: thumbnail.type }
    );
  }

  // Prisma에 데이터 저장
  const score = await prisma.creation.create({
    data: {
      title,
      titleEn: formData.get("titleEn") as string,
      titleJa: formData.get("titleJa") as string,
      description: formData.get("description") as string,
      type: isOriginal ? CreationType.ORIGINAL_SCORE : CreationType.SCORE,
      fileUrl: fileBlob.url,
      thumbnailUrl: thumbnailBlob?.url,
      price: isForSale
        ? parseFloat(formData.get("price") as string)
        : undefined,
      tempo: formData.get("tempo")
        ? parseInt(formData.get("tempo") as string)
        : undefined,
      key,
      referenceUrls: JSON.parse(formData.get("referenceUrls") as string),
      lyrics: formData.get("lyrics") as string,
      lyricsEn: formData.get("lyricsEn") as string,
      lyricsJa: formData.get("lyricsJa") as string,
      composer: formData.get("composer") as string,
      lyricist: formData.get("lyricist") as string,
      saleStartDate: formData.get("saleStartDate")
        ? new Date(formData.get("saleStartDate") as string)
        : undefined,
      saleEndDate: formData.get("saleEndDate")
        ? new Date(formData.get("saleEndDate") as string)
        : undefined,
      isPublic,
      isForSale,
      isOriginal,
      genre: genre || undefined,
      creatorId: payload.userId,
      churchId: payload.churchId!,
    },
  });

  return NextResponse.json(score, { status: 201 });
}
