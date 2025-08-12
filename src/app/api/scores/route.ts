// src/app/api/scores/route.ts

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { TokenPayload, verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { CreationType, Genre } from "@prisma/client";
import { allowedRoles } from "./allowedRoles";
import { createKoreaDate } from "@/utils/creatKoreaDate";
import { constants } from "@/constants/intex";

const { KEYS, TONES } = constants;

// 타입 가드를 위한 유틸리티 함수
const isValidKey = (value: string): value is (typeof KEYS)[number] =>
  KEYS.includes(value as (typeof KEYS)[number]);
const isValidTone = (value: string): value is (typeof TONES)[number] =>
  TONES.includes(value as (typeof TONES)[number]);

// INT4 범위 상수
const INT4_MIN = -2147483648;
const INT4_MAX = 2147483647;

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
      scoreKeys: { select: { key: true, fileUrl: true } },
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
  const title = formData.get("title") as string;
  const isPublic = formData.get("isPublic") === "true";
  const isForSale = formData.get("isForSale") === "true";
  const isOriginal = formData.get("isOriginal") === "true";
  const genre = formData.get("genre") as Genre;
  const scoreKeysRaw: { key: string; file: File | null }[] = [];

  // scoreKeys 처리
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("scoreKeys[")) {
      const match = key.match(/scoreKeys\[(\d+)\]\.(\w+)/);
      if (match) {
        const index = parseInt(match[1]);
        const field = match[2];
        if (!scoreKeysRaw[index]) scoreKeysRaw[index] = { key: "", file: null };
        if (field === "key") scoreKeysRaw[index].key = value as string;
        if (field === "file" && value instanceof File)
          scoreKeysRaw[index].file = value;
      }
    }
  }

  // 기존 fileUrl과 key 호환성 처리
  const file = formData.get("file") as File;
  const key = formData.get("key") as string;
  if (file && key && !scoreKeysRaw.length) {
    scoreKeysRaw.push({ key, file });
  }

  // 필수 필드 검증
  if (!scoreKeysRaw.length || scoreKeysRaw.some((sk) => !sk.file || !sk.key)) {
    return NextResponse.json(
      { error: "악보 파일과 코드 키는 필수입니다." },
      { status: 400 }
    );
  }

  for (const sk of scoreKeysRaw) {
    if (!sk.file || !["image/jpeg", "application/pdf"].includes(sk.file.type)) {
      return NextResponse.json(
        { error: "jpg 또는 pdf 파일만 업로드 가능합니다." },
        { status: 400 }
      );
    }
    const [keyNote, tone] = sk.key.split(" ");
    if (!isValidKey(keyNote) || !isValidTone(tone)) {
      return NextResponse.json(
        { error: "유효하지 않은 코드 키입니다." },
        { status: 400 }
      );
    }
  }

  if (isForSale && !isOriginal) {
    return NextResponse.json(
      { error: "자작곡이 아닌 악보는 판매할 수 없습니다." },
      { status: 400 }
    );
  }

  // tempo 값 검증
  const tempoRaw = formData.get("tempo") as string | null;
  let tempo: number | undefined;
  if (tempoRaw) {
    const parsedTempo = parseInt(tempoRaw);
    if (isNaN(parsedTempo)) {
      return NextResponse.json(
        { error: "tempo는 유효한 정수여야 합니다." },
        { status: 400 }
      );
    }
    if (parsedTempo < INT4_MIN || parsedTempo > INT4_MAX) {
      return NextResponse.json(
        {
          error: `tempo는 ${INT4_MIN}에서 ${INT4_MAX} 사이의 값이어야 합니다.`,
        },
        { status: 400 }
      );
    }
    tempo = parsedTempo;
  }

  const koreaDate = createKoreaDate();

  // Vercel Blob에 파일 업로드 및 ScoreKey 데이터 준비
  const scoreKeyData = await Promise.all(
    scoreKeysRaw.map(async (sk, index) => {
      const fileBlob = await put(
        `scores/${payload.churchId}/${payload.userId}/${koreaDate}-${index}-${sk.file!.name}`,
        sk.file!,
        { access: "public", contentType: sk.file!.type }
      );
      return {
        key: sk.key,
        fileUrl: fileBlob.url,
      };
    })
  );

  // Prisma에 데이터 저장
  const score = await prisma.creation.create({
    data: {
      title,
      titleEn: formData.get("titleEn") as string,
      titleJa: formData.get("titleJa") as string,
      description: formData.get("description") as string,
      type: isOriginal ? CreationType.ORIGINAL_SCORE : CreationType.SCORE,
      fileUrl: "", // 임시로 빈 문자열 설정 (마이그레이션 후 제거)
      key: "", // 임시로 빈 문자열 설정 (마이그레이션 후 제거)
      price: isForSale
        ? parseFloat(formData.get("price") as string)
        : undefined,
      tempo,
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
      scoreKeys: {
        create: scoreKeyData.map((sk) => ({
          key: sk.key,
          fileUrl: sk.fileUrl,
        })),
      },
    },
    include: { scoreKeys: true },
  });

  return NextResponse.json(score, { status: 201 });
}
