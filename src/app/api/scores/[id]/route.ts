import { NextRequest, NextResponse } from "next/server";
import { TokenPayload, verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { allowedRoles } from "../allowedRoles";
import { getLocalIpAddress } from "@/utils/getLocalIpAddress";
import { Genre } from "@prisma/client";
import { put } from "@vercel/blob";
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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

  const { id } = await context.params;

  const score = await prisma.creation.findUnique({
    where: { id: id, isOpen: true },
    include: {
      creator: { select: { name: true } },
      likes: { where: { userId: payload.userId }, select: { id: true } },
      comments: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { likes: true, comments: true } },
      scoreKeys: { select: { key: true, fileUrl: true } },
    },
  });

  if (!score || (!score.isPublic && score.churchId !== payload.churchId)) {
    return NextResponse.json(
      { error: "악보를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const ip = getLocalIpAddress();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${ip}:3001`;

  const isLiked = score.likes.length > 0;

  return NextResponse.json(
    {
      ...score,
      isLiked,
      appUrl,
    },
    { status: 200 }
  );
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

  const { id } = await context.params;

  const score = await prisma.creation.findUnique({
    where: { id },
    select: { creatorId: true, churchId: true, isOpen: true },
  });

  if (!score) {
    return NextResponse.json(
      { error: "악보를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const isAuthorized =
    payload.userId === score.creatorId ||
    ["SUPER_ADMIN", "ADMIN"].includes(payload.role);

  if (!isAuthorized) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  if (!score.isOpen) {
    return NextResponse.json(
      { error: "이미 비공개된 악보입니다." },
      { status: 400 }
    );
  }

  try {
    const updatedScore = await prisma.creation.update({
      where: { id },
      data: { isOpen: false },
      include: {
        creator: { select: { name: true } },
        likes: { where: { userId: payload.userId }, select: { id: true } },
        comments: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { likes: true, comments: true } },
        scoreKeys: { select: { key: true, fileUrl: true } },
      },
    });

    const isLiked = updatedScore.likes.length > 0;

    return NextResponse.json(
      {
        ...updatedScore,
        isLiked,
        message: "악보가 성공적으로 비공개 처리되었습니다.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("악보 비공개 처리 오류:", error);
    return NextResponse.json(
      { error: "악보 비공개 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export interface ScoreFormData {
  title: string;
  titleEn?: string;
  titleJa?: string;
  genre?: string;
  description?: string;
  lyrics?: string;
  lyricsEn?: string;
  lyricsJa?: string;
  composer?: string;
  lyricist?: string;
  isPublic?: boolean;
  isForSale?: boolean;
  isOriginal?: boolean;
  price?: number;
  saleStartDate?: string;
  saleEndDate?: string;
  referenceUrls?: string[];
  tempo?: string;
  scoreKeys?: { key: string; file?: File | string; fileUrl?: string }[];
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

  const { id } = await context.params;

  const score = await prisma.creation.findUnique({
    where: { id },
    select: { creatorId: true, churchId: true, isOpen: true },
  });

  if (!score) {
    return NextResponse.json(
      { error: "악보를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const isAuthorized =
    payload.userId === score.creatorId ||
    ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"].includes(payload.role);

  if (!isAuthorized) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  if (!score.isOpen) {
    return NextResponse.json(
      { error: "비공개된 악보는 수정할 수 없습니다." },
      { status: 400 }
    );
  }

  try {
    // Content-Type 확인
    const contentType = req.headers.get("content-type") || "";
    let data: ScoreFormData;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      data = {
        title: formData.get("title") as string,
        titleEn: formData.get("titleEn") as string | undefined,
        titleJa: formData.get("titleJa") as string | undefined,
        genre: formData.get("genre") as string | undefined,
        description: formData.get("description") as string | undefined,
        lyrics: formData.get("lyrics") as string | undefined,
        lyricsEn: formData.get("lyricsEn") as string | undefined,
        lyricsJa: formData.get("lyricsJa") as string | undefined,
        composer: formData.get("composer") as string | undefined,
        lyricist: formData.get("lyricist") as string | undefined,
        isPublic: formData.get("isPublic") === "true",
        isForSale: formData.get("isForSale") === "true",
        isOriginal: formData.get("isOriginal") === "true",
        price: formData.get("price")
          ? Number(formData.get("price"))
          : undefined,
        saleStartDate: formData.get("saleStartDate") as string | undefined,
        saleEndDate: formData.get("saleEndDate") as string | undefined,
        referenceUrls: formData.get("referenceUrls")
          ? JSON.parse(formData.get("referenceUrls") as string)
          : undefined,
        tempo: formData.get("tempo") as string | undefined,
      };

      // scoreKeys 처리
      const scoreKeysRaw: {
        key: string;
        file: File | null;
        fileUrl?: string;
      }[] = [];
      for (const [key, value] of formData.entries()) {
        if (key.startsWith("scoreKeys[")) {
          const match = key.match(/scoreKeys\[(\d+)\]\[(\w+)\]/);
          if (match) {
            const index = parseInt(match[1]);
            const field = match[2];
            if (!scoreKeysRaw[index])
              scoreKeysRaw[index] = { key: "", file: null };
            if (field === "key") scoreKeysRaw[index].key = value as string;
            if (field === "file" && value instanceof File)
              scoreKeysRaw[index].file = value;
            if (field === "fileUrl")
              scoreKeysRaw[index].fileUrl = value as string;
          }
        }
      }

      if (scoreKeysRaw.length > 0) {
        data.scoreKeys = scoreKeysRaw.map((sk) => ({
          key: sk.key,
          file: sk.file ?? undefined,
          fileUrl: sk.fileUrl,
        }));
      }
    } else if (contentType.includes("application/json")) {
      try {
        data = await req.json();
      } catch (error) {
        console.error("JSON 파싱 오류:", error);
        return NextResponse.json(
          { error: "유효하지 않은 JSON 형식입니다." },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "지원되지 않는 Content-Type입니다." },
        { status: 400 }
      );
    }

    // 요청 데이터 로깅
    console.log("PUT 요청 데이터:", {
      id,
      data: {
        ...data,
        scoreKeys: data.scoreKeys?.map((sk) => ({
          key: sk.key,
          file: sk.file
            ? `[File: ${sk.file instanceof File ? sk.file.name : sk.file}]`
            : undefined,
          fileUrl: sk.fileUrl,
        })),
      },
    });

    // 필수 필드 검증
    if (!data.title || data.title.trim() === "") {
      return NextResponse.json(
        { error: "제목은 필수입니다." },
        { status: 400 }
      );
    }

    // tempo 값 검증
    let tempo: number | null = null;
    if (data.tempo) {
      const parsedTempo = Number(data.tempo);
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

    // genre 값 검증
    if (data.genre && !Object.values(Genre).includes(data.genre as Genre)) {
      return NextResponse.json(
        {
          error: `유효하지 않은 장르입니다. 유효한 장르: ${Object.values(Genre).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // saleStartDate, saleEndDate 값 검증
    if (data.saleStartDate) {
      const startDate = new Date(data.saleStartDate);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: "saleStartDate는 유효한 ISO 날짜 문자열이어야 합니다." },
          { status: 400 }
        );
      }
    }
    if (data.saleEndDate) {
      const endDate = new Date(data.saleEndDate);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "saleEndDate는 유효한 ISO 날짜 문자열이어야 합니다." },
          { status: 400 }
        );
      }
    }

    // referenceUrls 처리
    const processedReferenceUrls = data.referenceUrls
      ? data.referenceUrls.filter(
          (url): url is string => url !== undefined && url.trim() !== ""
        )
      : [];

    // price 값 검증
    let price: number | null = null;
    if (data.isForSale && data.price == null) {
      return NextResponse.json(
        { error: "판매용 악보는 가격이 필수입니다." },
        { status: 400 }
      );
    }
    if (data.price != null) {
      price = Number(data.price);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { error: "가격은 0 이상의 유효한 숫자여야 합니다." },
          { status: 400 }
        );
      }
    }

    // scoreKeys 유효성 검사 및 파일 업로드
    const processedScoreKeys: { key: string; fileUrl: string }[] = [];
    if (data.scoreKeys && data.scoreKeys.length > 0) {
      for (const sk of data.scoreKeys) {
        if (!sk.key || sk.key.trim() === "") {
          return NextResponse.json(
            { error: "scoreKeys의 key는 필수입니다." },
            { status: 400 }
          );
        }

        const [keyNote, tone] = sk.key.split(" ");
        if (!isValidKey(keyNote) || !isValidTone(tone)) {
          return NextResponse.json(
            { error: `유효하지 않은 코드 키입니다: ${sk.key}` },
            { status: 400 }
          );
        }

        let fileUrl = sk.fileUrl || "";
        if (sk.file instanceof File) {
          // 파일 형식 검증
          if (!["application/pdf", "image/jpeg"].includes(sk.file.type)) {
            return NextResponse.json(
              {
                error: `scoreKeys[${sk.key}]의 파일은 PDF 또는 JPG 형식이어야 합니다.`,
              },
              { status: 400 }
            );
          }

          // 파일 크기 제한 (10MB)
          if (sk.file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
              {
                error: `scoreKeys[${sk.key}]의 파일 크기는 10MB를 초과할 수 없습니다.`,
              },
              { status: 400 }
            );
          }

          // Vercel Blob에 파일 업로드
          const koreaDate = createKoreaDate();
          const fileBlob = await put(
            `scores/${payload.churchId}/${payload.userId}/${koreaDate}-${sk.key}-${sk.file.name}`,
            sk.file,
            { access: "public", contentType: sk.file.type }
          );
          fileUrl = fileBlob.url;
        } else if (!fileUrl) {
          return NextResponse.json(
            { error: `scoreKeys[${sk.key}]의 file 또는 fileUrl이 필요합니다.` },
            { status: 400 }
          );
        }

        processedScoreKeys.push({
          key: sk.key,
          fileUrl,
        });
      }
    }

    // scoreKeys 업데이트
    if (processedScoreKeys.length > 0) {
      await prisma.$transaction([
        prisma.scoreKey.deleteMany({
          where: { creationId: id },
        }),
        prisma.scoreKey.createMany({
          data: processedScoreKeys.map((sk) => ({
            creationId: id,
            key: sk.key,
            fileUrl: sk.fileUrl,
          })),
        }),
      ]);
    }

    const updatedScore = await prisma.creation.update({
      where: { id },
      data: {
        title: data.title,
        titleEn: data.titleEn || null,
        titleJa: data.titleJa || null,
        genre: data.genre ? (data.genre as Genre) : null,
        description: data.description || null,
        lyrics: data.lyrics || null,
        lyricsEn: data.lyricsEn || null,
        lyricsJa: data.lyricsJa || null,
        composer: data.composer || null,
        lyricist: data.lyricist || null,
        isPublic: data.isPublic ?? false,
        isForSale: data.isForSale ?? false,
        isOriginal: data.isOriginal ?? false,
        price,
        saleStartDate: data.saleStartDate ? new Date(data.saleStartDate) : null,
        saleEndDate: data.saleEndDate ? new Date(data.saleEndDate) : null,
        referenceUrls: processedReferenceUrls,
        tempo,
      },
      include: {
        creator: { select: { name: true } },
        likes: { where: { userId: payload.userId }, select: { id: true } },
        comments: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { likes: true, comments: true } },
        scoreKeys: { select: { key: true, fileUrl: true } },
      },
    });

    const isLiked = updatedScore.likes.length > 0;

    return NextResponse.json(
      {
        ...updatedScore,
        isLiked,
        message: "악보가 성공적으로 수정되었습니다.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("악보 수정 오류:", {
      message: errorMessage,
      stack: errorStack,
      details: error,
    });
    return NextResponse.json(
      { error: "악보 수정 중 오류가 발생했습니다.", details: errorMessage },
      { status: 500 }
    );
  }
}
