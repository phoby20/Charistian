import { NextRequest, NextResponse } from "next/server";
import { TokenPayload, verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

// UpdateSetlistRequest 타입 정의 (CreateSetlistRequest와 일치하도록 수정)
interface UpdateSetlistRequest {
  title: string;
  date: string;
  description?: string;
  scores: { creationId: string; order: number }[];
  shares: {
    groupId?: string | null;
    teamId?: string | null;
    userId?: string | null;
  }[];
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("token")?.value;
  if (!token)
    return NextResponse.json(
      { error: "인증되지 않았습니다." },
      { status: 401 }
    );

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
  const setlist = await prisma.setlist.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true, id: true } },
      scores: {
        select: {
          id: true,
          creation: { select: { id: true, title: true, fileUrl: true } },
          order: true,
        },
      },
      comments: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      shares: {
        include: {
          group: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!setlist)
    return NextResponse.json(
      { error: "세트리스트를 찾을 수 없습니다." },
      { status: 404 }
    );

  // 권한 확인
  const hasAccess = await checkAccess(payload.userId, id);
  if (!hasAccess)
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  return NextResponse.json(setlist, { status: 200 });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("token")?.value;
  if (!token)
    return NextResponse.json(
      { error: "인증되지 않았습니다." },
      { status: 401 }
    );

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
  const setlist = await prisma.setlist.findUnique({
    where: { id },
    select: { creatorId: true },
  });

  if (!setlist)
    return NextResponse.json(
      { error: "세트리스트를 찾을 수 없습니다." },
      { status: 404 }
    );

  if (
    payload.userId !== setlist.creatorId &&
    !["SUPER_ADMIN", "ADMIN"].includes(payload.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    await prisma.setlist.delete({ where: { id } });
    return NextResponse.json(
      { message: "세트리스트가 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("세트리스트 삭제 오류:", error);
    return NextResponse.json(
      { error: "세트리스트 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("token")?.value;
  if (!token)
    return NextResponse.json(
      { error: "인증되지 않았습니다." },
      { status: 401 }
    );

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
  const setlist = await prisma.setlist.findUnique({
    where: { id },
    select: { creatorId: true },
  });
  if (!setlist)
    return NextResponse.json(
      { error: "세트리스트를 찾을 수 없습니다." },
      { status: 404 }
    );

  if (
    payload.userId !== setlist.creatorId &&
    !["SUPER_ADMIN", "ADMIN"].includes(payload.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { title, date, description, scores, shares }: UpdateSetlistRequest =
    await req.json();
  if (!title || !date)
    return NextResponse.json(
      { error: "title과 date는 필수입니다." },
      { status: 400 }
    );

  try {
    await prisma.$transaction([
      prisma.setlistScore.deleteMany({ where: { setlistId: id } }), // score -> setlistScore
      prisma.setlistShare.deleteMany({ where: { setlistId: id } }), // share -> setlistShare
      prisma.setlist.update({
        where: { id },
        data: {
          title,
          date: new Date(date),
          description,
          scores: {
            create: scores.map((s) => ({
              creationId: s.creationId,
              order: s.order,
            })),
          },
          shares: {
            create: shares.map((s) => ({
              groupId: s.groupId ?? undefined,
              teamId: s.teamId ?? undefined,
              userId: s.userId ?? undefined,
            })),
          },
        },
      }),
    ]);
    return NextResponse.json(
      { message: "세트리스트가 업데이트되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("세트리스트 업데이트 오류:", error);
    return NextResponse.json(
      { error: "세트리스트 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

async function checkAccess(
  userId: string,
  setlistId: string
): Promise<boolean> {
  const setlist = await prisma.setlist.findUnique({
    where: { id: setlistId },
    include: {
      creator: { select: { id: true } },
      shares: {
        include: {
          group: { include: { users: { where: { id: userId } } } },
          team: { include: { users: { where: { id: userId } } } },
          user: { where: { id: userId } },
        },
      },
    },
  });

  if (!setlist) return false;

  if (setlist.creator.id === userId) return true;

  return setlist.shares.some((share) => {
    return (
      share.userId === userId ||
      (share.group?.users?.length ?? 0) > 0 ||
      (share.team?.users?.length ?? 0) > 0
    );
  });
}
