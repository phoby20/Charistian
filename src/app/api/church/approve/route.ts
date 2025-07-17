import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Resend } from "resend";

// 기본 직분, 직책, 그룹, 팀, 서브그룹 데이터
const defaultPositions = [
  "목사",
  "전도사",
  "집사",
  "권사",
  "장로",
  "원로목사",
  "원로장로",
  "원로권사",
  "안수집사",
  "일반",
];

const defaultDuties = [
  "초등부 찬양팀 리더",
  "중등부 찬양팀 리더",
  "고등부 찬양팀 리더",
  "청년부 찬양팀 리더",
  "교회학교 교장",
  "교회학교 교감",
  "교회학교 교사",
  "청년부 회장",
  "청년부 부회장",
  "청년부 서기",
  "청년부 회계",
];

const defaultGroups = [
  "유아부",
  "유치부",
  "초등부",
  "중등부",
  "고등부",
  "중고등부",
  "청년부",
  "청장년부",
  "대학부",
  "장년부",
  "선교부",
  "청소년부",
  "무소속",
];

const defaultTeams = [
  "찬양팀",
  "기도팀",
  "봉사팀",
  "재정팀",
  "교육팀",
  "예배팀",
  "사역팀",
  "미디어팀",
];

const classSubGroups = ["1반", "2반", "3반"];
const districtSubGroups = ["1교구", "2교구", "3교구"];

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

  const emailText = `
    ${churchName} 교회 등록 완료

    안녕하세요, ${churchName} 교회의 등록이 성공적으로 완료되었습니다.

    [찬양 콘티 작성 및 공유 방법]
    1. [악보관련] > [악보 리스트] 페이지에서 악보를 등록하세요. (최대 50건, 누구나 가능)
    2. 등록된 악보를 선택하여 찬양 콘티를 작성합니다.
    3. 공유 대상자를 설정하고 [콘티 작성] 버튼을 눌러 메일로 콘티와 악보를 공유합니다.
    - 무료 플랜: 성도 10명 등록, 월 8건/주 2건 콘티 작성 가능.
    - 플랜은 언제든지 Smart 또는 Enterprise로 변경 가능.

    [CHECKER 계정 정보]
    - 이메일: ${checkerEmail}
    - 비밀번호: ${checkerPassword}

    [수퍼 어드민의 역할]
    1. 로그인 후 [설정] > [마스터 설정]에서 직분, 소속, 직책, 팀을 설정하세요.
    2. 성도 가입 신청을 승인/거부하고, [성도관리] > [성도리스트]에서 소속, 직책, 팀, 권한을 설정하세요.
    3. 예배/이벤트 날에 CHECKER 계정으로 QR 코드를 스캔하여 출석 체크하세요.

    [성도의 역할]
    1. 로그인 후 [성도증] 버튼을 눌러 QR 코드를 표시하세요.
    2. 누구나 악보를 등록하고, 찬양 콘티를 작성/열람할 수 있습니다.

    [주의사항]
    - 무료 플랜은 제한이 있으며, 추후 유료화될 수 있습니다.
    - 권한: 수퍼 어드민, 어드민, 서브 어드민, 일반, 방문자.
    - 직분/소속/직책/팀 설정과 출석 체크는 권한에 따라 제한됩니다.

    Charistian 방문하기: https://www.charistian.com/
    구독 취소: https://www.charistian.com/unsubscribe?email=${encodeURIComponent(superAdminEmail)}
  `;

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${churchName} 교회 등록 완료</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                background-color: #f9fafb;
                color: #333333;
                margin: 0;
                padding: 20px;
                line-height: 1.5;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 6px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            h1 {
                font-size: 24px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 15px;
                text-align: center;
            }
            h2 {
                font-size: 20px;
                font-weight: 600;
                color: #1f2937;
                margin: 25px 0 10px;
            }
            h3 {
                font-size: 18px;
                font-weight: 500;
                color: #374151;
                margin: 20px 0 10px;
            }
            p {
                font-size: 16px;
                color: #374151;
                margin: 8px 0;
            }
            ul, ol {
                font-size: 16px;
                color: #374151;
                padding-left: 20px;
                margin: 8px 0 15px;
            }
            li {
                margin-bottom: 8px;
            }
            a {
                color: #3b82f6;
                text-decoration: none;
            }
            a:hover {
                text-decoration: underline;
            }
            strong {
                font-weight: 600;
                color: #1f2937;
            }
            .section {
                border-top: 1px solid #e5e7eb;
                padding-top: 20px;
                margin-top: 20px;
            }
            .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #3b82f6;
                color: #ffffff;
                text-decoration: none;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 500;
                text-align: center;
                transition: background-color 0.2s ease;
                margin: 20px 0;
            }
            .button:hover {
                background-color: #2563eb;
            }
            .footer {
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                margin-top: 20px;
            }
            .footer p {
                font-size: 14px;
                color: #6b7280;
                margin: 5px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- 헤더 섹션 -->
            <h1>${churchName} 교회 등록 완료</h1>
            <p>안녕하세요, ${churchName} 교회의 등록이 성공적으로 완료되었습니다.</p>

            <!-- 찬양 콘티 작성 및 공유 방법 -->
            <div class="section">
                <h2>찬양 콘티 작성 및 공유 방법</h2>
                <p>Charistian에서 찬양 콘티를 작성하고 공유하는 방법은 다음과 같습니다:</p>
                <ol>
                    <li><strong>악보 등록</strong>: [악보관련] > [악보 리스트] 페이지에서 악보를 등록하세요. 모든 성도가 악보를 등록할 수 있으며, 등록된 악보만 콘티 작성에 사용됩니다. (무료 플랜: 최대 50건)</li>
                    <li><strong>콘티 작성</strong>: 등록된 악보를 선택하여 찬양 콘티를 작성합니다.</li>
                    <li><strong>콘티 공유</strong>: 공유 대상자를 설정한 후 [콘티 작성] 버튼을 눌러 콘티와 악보를 메일로 공유합니다.</li>
                </ol>
                <p><strong>무료 플랜 제한</strong>: 성도 10명 등록, 월 8건/주 2건의 찬양 콘티 작성 가능.</p>
                <p><strong>플랜 변경</strong>: 언제든지 Smart 또는 Enterprise 플랜으로 업그레이드하여 더 많은 기능을 이용할 수 있습니다.</p>
            </div>

            <!-- CHECKER 계정 정보 -->
            <div class="section">
                <h2>CHECKER 계정 정보</h2>
                <p>QR 코드 스캔을 위한 CHECKER 계정이 생성되었습니다:</p>
                <ul>
                    <li><strong>이메일</strong>: ${checkerEmail}</li>
                    <li><strong>비밀번호</strong>: ${checkerPassword}</li>
                </ul>
            </div>

            <!-- 수퍼 어드민 및 성도 역할 -->
            <div class="section">
                <h2>서비스 이용 안내</h2>

                  <!-- 교회가 할 일 -->
                  <h3>교회가 할 일</h3>
                  <ol>
                      <li>로그인 후 <strong>[설정] > [마스터 설정]</strong>에서 "직분설정", "소속설정", "직책설정", "팀 설정"을 진행하세요. (기본적인 직분과 소속, 직책, 팀이 표시되며 수정/삭제/추가 할 수 있습니다.)</li>
                      <li>교회 성도들에게 <a href="https://www.charistian.com/">https://www.charistian.com/</a> 가입을 안내하세요. 성도는 재적 중인 교회의 나라, 도시, 지역을 선택하면 등록된 교회 목록에서 ${churchName}을 선택할 수 있습니다.</li>
                      <li>회원 가입을 한 성도는 교회에서 승인을 해야 서비스 이용이 가능합니다. 성도가 회원가입을 하면 대시보드 페이지에 알림이 표시됩니다. <strong>${superAdminEmail}</strong>으로 로그인하여 등록 신청을 승인/거부하세요.</li>
                      <li>[성도관리] > [성도리스트]에서 승인된 성도의 소속, 직책, 팀, 권한을 설정하세요.</li>
                      <li>예배일 또는 이벤트 날에 스마트폰/태블릿으로 앞서 알려드린 CHECKER 유저(${checkerEmail})로 로그인한 뒤 <strong>QR스캔</strong> 버튼을 클릭하여 입장하는 성도의 QR 코드를 스캔하세요.</li>
                      <li>QR 코드가 없는 성도는 화면 상단 메뉴에서 <strong>[성도관리] > [출석체크]</strong>로 이동하여 소속된 회원을 찾아 클릭하면 출석체크가 완료됩니다.</li>
                  </ol>

                <h3>성도의 역할</h3>
                <ol>
                    <li>로그인 후 <strong>[성도증]</strong> 버튼을 눌러 QR 코드를 표시하여 출석 체크하세요.</li>
                    <li>누구나 [악보관련] > [악보 리스트]에서 악보를 등록하고, 찬양 콘티를 작성 및 열람할 수 있습니다.</li>
                </ol>

                <h3>주의사항</h3>
                <ol>
                    <li>현재 무료 플랜으로 제공되며, 추후 유료화될 수 있습니다.</li>
                    <li>권한은 수퍼 어드민, 어드민, 서브 어드민, 일반, 방문자로 나뉩니다.</li>
                    <li>직분/소속/직책/팀 설정은 수퍼 어드민만 가능하며, 출석 체크는 수퍼 어드민, 어드민, 서브 어드민만 가능합니다.</li>
                </ol>
            </div>

            <!-- 버튼 섹션 -->
            <div style="text-align: center;">
                <a href="https://www.charistian.com/" class="button">Charistian 방문하기</a>
            </div>

            <!-- 푸터 섹션 -->
            <div class="footer">
                <p>이 이메일은 Charistian에서 자동 발송되었습니다.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: "charistian 운영팀 <noreply@charistian.com>",
    to: superAdminEmail,
    subject: `${churchName} 교회 등록 완료 안내`,
    html: emailHtml,
    text: emailText, // 텍스트 버전 추가
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
