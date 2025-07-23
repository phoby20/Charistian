// src/app/[locale]/terms-of-service/page.tsx
"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Button from "@/components/Button";
import Loading from "@/components/Loading";

function TermsOfServiceContent() {
  const t = useTranslations("TermsOfService");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get("type"); // URL 파라미터에서 type 읽기

  const handleRegister = () => {
    if (!userType || !["church", "member"].includes(userType)) {
      alert(t("selectUserType") || "사용자 유형을 선택하세요");
      return;
    }
    const path = userType === "church" ? "/church-registration" : "/signup";
    router.push(`/${locale}${path}`);
  };

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-blue-100 via-white to-purple-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col">
      <div className="max-w-lg max-h-[calc(70vh-150px)] mx-auto bg-white rounded-2xl shadow-xl p-8 flex-grow">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center tracking-tight">
          {t("title") || "이용약관"}
        </h1>
        {/* 스크롤 가능한 텍스트 영역 */}
        <div className="max-h-[calc(70vh-300px)] overflow-y-auto space-y-8 text-gray-600 pr-4">
          {/* 제1조: 총칙 */}
          <section>
            <h2 className="text-gray-800 mb-3">
              {t("article1.title") || "제1조 (총칙)"}
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>{t("article1.item1")}</li>
              <li>{t("article1.item2")}</li>
              <li>{t("article1.item3")}</li>
              <li>{t("article1.item4")}</li>
            </ol>
          </section>

          {/* 제2조: 사용자 구분 및 권한 */}
          <section>
            <h2 className="text-gray-800 mb-3">
              {t("article2.title") || "제2조 (사용자 구분 및 권한)"}
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>{t("article2.item1")}</li>
              <li>{t("article2.item2")}</li>
              <li>{t("article2.item3")}</li>
              <li>{t("article2.item4")}</li>
            </ol>
          </section>

          {/* 제3조: 서비스 플랜 */}
          <section>
            <h2 className="text-gray-800 mb-3">
              {t("article3.title") || "제3조 (서비스 플랜)"}
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>
                {t("article3.item1")}
                <ul className="list-disc pl-5 mt-2">
                  <li>{t("article3.freePlan")}</li>
                  <li>{t("article3.smartPlan")}</li>
                  <li>{t("article3.enterprisePlan")}</li>
                </ul>
              </li>
              <li>{t("article3.item2")}</li>
            </ol>
          </section>

          {/* 제4조: 결제 및 구독 */}
          <section>
            <h2 className="text-gray-800 mb-3">
              {t("article4.title") || "제4조 (결제 및 구독)"}
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>{t("article4.item1")}</li>
              <li>{t("article4.item2")}</li>
              <li>{t("article4.item3")}</li>
            </ol>
          </section>

          {/* 제5조: 환불 정책 */}
          <section>
            <h2 className="text-gray-800 mb-3">
              {t("article5.title") || "제5조 (환불 정책)"}
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>{t("article5.item1")}</li>
              <li>{t("article5.item2")}</li>
              <li>{t("article5.item3")}</li>
            </ol>
          </section>

          {/* 제6조: 문의 */}
          <section>
            <h2 className="text-gray-800 mb-3">
              {t("article6.title") || "제6조 (문의)"}
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>
                {t("article6.item1", { email: "charistian.co@gmail.com" }) ||
                  "문의는 이메일(charistian.co@gmail.com)을 통해 가능합니다."}
              </li>
            </ol>
          </section>
        </div>
        {/* 동의 버튼 */}
        {userType && (
          <section className="mt-30">
            <Button
              onClick={handleRegister}
              className="cursor-pointer w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {t("agreeAndRegister") || "동의하고 가입"}
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}

export default function TermsOfServicePage() {
  return (
    <Suspense fallback={<Loading />}>
      <TermsOfServiceContent />
    </Suspense>
  );
}
