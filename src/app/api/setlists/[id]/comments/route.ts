import { NextRequest, NextResponse } from "next/server";
import { TokenPayload, verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

// 요청 바디의 타입 정의
interface CreateCommentRequest {
  content: string;
}

export async function POST(
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
  const { content }: CreateCommentRequest = await req.json();

  // 입력 데이터 유효성 검사
  if (!content || typeof content !== "string" || content.trim() === "") {
    return NextResponse.json(
      { error: "댓글 내용이 필요합니다." },
      { status: 400 }
    );
  }

  const hasAccess = await checkAccess(payload.userId, id);
  if (!hasAccess)
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  try {
    const comment = await prisma.setlistComment.create({
      data: {
        setlistId: id,
        userId: payload.userId,
        content,
      },
      include: { user: { select: { name: true } } },
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("댓글 작성 오류:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "댓글 작성 중 오류가 발생했습니다." },
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

  return setlist.shares.some((share) => {
    // creatorId, userId, group.users, team.users 중 하나라도 매치되면 접근 허용
    return (
      setlist.creatorId === userId ||
      share.userId === userId ||
      (share.group?.users?.length ?? 0) > 0 ||
      (share.team?.users?.length ?? 0) > 0
    );
  });
}
