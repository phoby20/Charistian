import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Resend } from "resend";

// 기본 직분, 직책, 그룹, 팀, 서브그룹 데이터
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

const defaultGroups = [
  "유아부(幼兒部)",
  "유치부(幼稚部)",
  "초등부(小学部)",
  "중등부(中学部)",
  "고등부(高校部)",
  "중고등부(中高等部)",
  "청년부(青年部)",
  "청장년부(靑長年部)",
  "대학부(大學部)",
  "장년부(長年部)",
  "여성부(女性部)",
  "남성부(男性部)",
  "선교부(宣敎部)",
  "청소년부(靑少年部)",
  "무소속(無所属)",
];

const defaultTeams = [
  "찬양팀(賛美チーム)",
  "기도팀(祈禱チーム)",
  "봉사팀(奉仕チーム)",
  "행정팀(行政チーム)",
  "재정팀(財政チーム)",
  "교육팀(教育チーム)",
  "문화팀(文化チーム)",
  "홍보팀(広報チーム)",
  "사회봉사팀(社會奉仕チーム)",
  "예배팀(礼拜チーム)",
  "성경공부팀(聖經勉強チーム)",
  "사역팀(事業チーム)",
  "행사팀(行事チーム)",
  "기획팀(企劃チーム)",
  "음악팀(音樂チーム)",
  "미디어팀(メディアチーム)",
];

const classSubGroups = ["1반", "2반", "3반"];
const districtSubGroups = ["1교구(1教区)", "2교구(2教区)", "3교구(3教区)"];

// SubGroupInput 인터페이스 정의
interface SubGroupInput {
  name: string;
  groupId: string;
  churchId: string;
}

// 6자리 랜덤 숫자 비밀번호 생성 함수
function generateRandomPassword(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 5자리 랜덤 숫자 생성 함수
function generateRandomFiveDigits(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// 이메일 전송 함수
async function sendApprovalEmail(
  superAdminEmail: string,
  checkerEmail: string,
  checkerPassword: string,
  churchName: string
) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "charistian 운영팀 <noreply@charistian.com>",
    to: superAdminEmail,
    subject: `${churchName} 교회 등록 완료 안내`,
    html: `
      <h1>${churchName} 교회 등록 완료</h1>
      <p>안녕하세요, ${churchName} 교회의 등록이 성공적으로 완료되었습니다.</p>
      <h2>CHECKER 유저 정보</h2>
      <p>QR 코드 스캔을 위한 CHECKER 유저 계정이 아래와 같이 생성되었습니다:</p>
      <ul>
        <li><strong>이메일</strong>: ${checkerEmail}</li>
        <li><strong>비밀번호</strong>: ${checkerPassword}</li>
      </ul>
      <h2>서비스 이용 안내</h2>
      <h3>교회가 할 일</h3>
      <ol>
        <li>로그인 후 <strong>설정 > 마스터 설정</strong>에서 "직분설정", "소속설정", "직책설정", "팀 설정"을 진행하세요.</li>
        <li>교회 성도들에게 <a href="https://www.charistian.com/">https://www.charistian.com/</a> 가입을 안내하세요. 성도는 재적 중인 교회의 나라, 도시, 지역을 선택하면 등록된 교회 목록에서 ${churchName}을 선택할 수 있습니다.</li>
        <li>성도가 회원 등록을 신청하면 <strong>${superAdminEmail}</strong>으로 로그인하여 등록 신청을 승인/거부하세요.</li>
        <li>승인된 성도의 소속, 직책, 팀을 설정하세요.</li>
        <li>예배일 또는 이벤트 날에 스마트폰/태블릿으로 CHECKER 유저(${checkerEmail})로 로그인한 뒤 <strong>QR스캔</strong> 버튼을 클릭하여 입장하는 성도의 QR 코드를 스캔하세요.</li>
        <li>QR 코드가 없는 성도는 화면 상단 메뉴에서 <strong>성도관리 > 출석체크</strong>로 이동하여 소속된 회원을 찾아 클릭하면 출석체크가 완료됩니다.</li>
      </ol>
      <h3>성도가 할 일</h3>
      <ol>
        <li>로그인 후 <strong>성도증</strong> 버튼을 클릭하세요.</li>
        <li>교회에서 준비한 QR 스캐너에 QR 코드를 스캔하세요.</li>
      </ol>
    `,
  });
}

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

    // CHECKER 유저 이메일 생성
    const superAdminEmail = application.superAdminEmail.toLowerCase();
    const emailPrefix = superAdminEmail.split("@")[0];
    const emailDomain = superAdminEmail.split("@")[1];
    const randomDigits = generateRandomFiveDigits();
    const checkerEmail = `${emailPrefix}_${randomDigits}_checker@${emailDomain}`;
    const checkerPassword = generateRandomPassword();

    // 트랜잭션으로 Church, User(SUPER_ADMIN), User(CHECKER), ChurchPosition, Duty, Group, SubGroup, Team 생성 및 Application 업데이트
    const [church, superAdminUser, checkerUser, updatedApplication] =
      await prisma.$transaction(
        async (tx) => {
          // 1. SUPER_ADMIN 이메일 중복 체크
          const existingSuperAdmin = await tx.user.findUnique({
            where: { email: superAdminEmail },
          });
          if (existingSuperAdmin) {
            throw new Error("SUPER_ADMIN 이메일이 이미 등록되어 있습니다");
          }

          // 2. CHECKER 이메일 중복 체크
          const existingChecker = await tx.user.findUnique({
            where: { email: checkerEmail },
          });
          if (existingChecker) {
            throw new Error("CHECKER 이메일이 이미 등록되어 있습니다");
          }

          // 3. 교회 생성
          const church = await tx.church.create({
            data: {
              name: application.churchName,
              address: application.address,
              city: application.city,
              region: application.region,
              country: application.country,
              phone: application.churchPhone,
              logo: application.logo,
              plan: application.plan,
              state: "APPROVED",
            },
          });

          // 4. SUPER_ADMIN 유저 생성
          const superAdminUser = await tx.user.create({
            data: {
              email: superAdminEmail,
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
              church: {
                connect: { id: church.id },
              },
            },
          });

          // 5. CHECKER 유저 생성
          const checkerUser = await tx.user.create({
            data: {
              email: checkerEmail,
              password: checkerPassword,
              name: "Checker User",
              birthDate: new Date("1970-01-01"),
              gender: "Unknown",
              country: application.country,
              region: "Unknown",
              role: "CHECKER",
              state: "APPROVED",
              church: {
                connect: { id: church.id },
              },
            },
          });

          // 6. 기본 직분(ChurchPosition) 생성
          const positionData = defaultPositions.map((name) => ({
            name,
            churchId: church.id,
          }));
          await tx.churchPosition.createMany({
            data: positionData,
          });

          // 7. 기본 직책(Duty) 생성
          const dutyData = defaultDuties.map((name) => ({
            name,
            churchId: church.id,
          }));
          await tx.duty.createMany({
            data: dutyData,
          });

          // 8. 기본 그룹(Group) 생성
          const groupData = defaultGroups.map((name) => ({
            name,
            churchId: church.id,
          }));
          await tx.group.createMany({
            data: groupData,
            skipDuplicates: true, // 중복 방지
          });

          // 생성된 그룹 조회
          const createdGroups = await tx.group.findMany({
            where: { churchId: church.id },
            select: { id: true, name: true },
          });

          // 9. 기본 서브그룹(SubGroup) 생성
          const classGroupNames = [
            "유아부(幼兒部)",
            "유치부(幼稚部)",
            "초등부(小学部)",
            "중등부(中学部)",
            "고등부(高校部)",
            "중고등부(中高等部)",
          ];
          const districtGroupNames = [
            "청년부(青年部)",
            "청장년부(靑長年部)",
            "대학부(大學部)",
            "장년부(長年部)",
          ];

          const subGroupData: SubGroupInput[] = [];
          createdGroups.forEach((group) => {
            const subGroups = classGroupNames.includes(group.name)
              ? classSubGroups.map((subGroupName) => ({
                  name: subGroupName,
                  groupId: group.id,
                  churchId: church.id,
                }))
              : districtGroupNames.includes(group.name)
                ? districtSubGroups.map((subGroupName) => ({
                    name: subGroupName,
                    groupId: group.id,
                    churchId: church.id,
                  }))
                : [];
            subGroupData.push(...subGroups);
          });

          if (subGroupData.length > 0) {
            await tx.subGroup.createMany({
              data: subGroupData,
              skipDuplicates: true, // 중복 방지
            });
          }

          // 10. 기본 팀(Team) 생성
          const teamData = defaultTeams.map((name) => ({
            name,
            churchId: church.id,
          }));
          await tx.team.createMany({
            data: teamData,
            skipDuplicates: true, // 중복 방지
          });

          // 11. ChurchApplication 상태 업데이트
          const updatedApplication = await tx.churchApplication.update({
            where: { id: applicationId },
            data: { state: "APPROVED" },
          });

          return [church, superAdminUser, checkerUser, updatedApplication];
        },
        { timeout: 15000 } // 타임아웃을 15초로 증가
      );

    // 이메일 전송
    await sendApprovalEmail(
      superAdminEmail,
      checkerEmail,
      checkerPassword,
      church.name
    );

    return NextResponse.json(
      {
        message: "교회 신청이 승인되었습니다",
        church,
        superAdminUser,
        checkerUser,
        updatedApplication,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("교회 신청 승인 중 오류:", error);

    if (error instanceof Error) {
      if (error.message.includes("SUPER_ADMIN 이메일")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes("CHECKER 이메일")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

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
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "중복된 데이터가 존재합니다" },
          { status: 400 }
        );
      }
      if (error.code === "P2028") {
        return NextResponse.json(
          { error: "트랜잭션 타임아웃이 발생했습니다. 다시 시도해주세요." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
