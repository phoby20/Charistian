// src/app/[locale]/privacy-policy/page.tsx
"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Button from "@/components/Button";
import Loading from "@/components/Loading";

function PrivacyPolicyContent() {
  const t = useTranslations("PrivacyPolicy");
  const tLanding = useTranslations("Landing");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get("type"); // TermsOfService와의 연계 유지

  const handleRegister = () => {
    if (!userType || !["church", "member"].includes(userType)) {
      alert(tLanding("selectUserType") || "사용자 유형을 선택하세요");
      return;
    }
    const path = userType === "church" ? "/church-registration" : "/signup";
    router.push(`/${locale}${path}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center tracking-tight">
          {t("title") || "개인정보처리방침"}
        </h1>
        <div className="space-y-8 text-gray-600">
          {/* 제1조: 수집하는 정보 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              {t("article1.title") || "제1조 (수집하는 정보)"}
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                {t("article1.item1")}
                <ul className="list-disc pl-5 mt-2">
                  <li>{t("article1.subItems.item1")}</li>
                  <li>{t("article1.subItems.item2")}</li>
                  <li>{t("article1.subItems.item3")}</li>
                  <li>{t("article1.subItems.item4")}</li>
                </ul>
              </li>
            </ol>
          </section>

          {/* 제2조: 개인정보의 이용 목적 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              {t("article2.title") || "제2조 (개인정보의 이용 목적)"}
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                {t("article2.item1")}
                <ul className="list-disc pl-5 mt-2">
                  <li>{t("article2.subItems.item1")}</li>
                  <li>{t("article2.subItems.item2")}</li>
                  <li>{t("article2.subItems.item3")}</li>
                  <li>{t("article2.subItems.item4")}</li>
                </ul>
              </li>
            </ol>
          </section>

          {/* 제3조: 개인정보의 제3자 제공 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              {t("article3.title") || "제3조 (개인정보의 제3자 제공)"}
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>{t("article3.item1")}</li>
              <li>{t("article3.item2")}</li>
            </ol>
          </section>

          {/* 제4조: 개인정보의 보호 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              {t("article4.title") || "제4조 (개인정보의 보호)"}
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>{t("article4.item1")}</li>
              <li>{t("article4.item2")}</li>
            </ol>
          </section>

          {/* 제5조: 사용자의 권리 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              {t("article5.title") || "제5조 (사용자의 권리)"}
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>{t("article5.item1")}</li>
              <li>{t("article5.item2")}</li>
            </ol>
          </section>

          {/* 제6조: 문의 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              {t("article6.title") || "제6조 (문의)"}
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                {t("article6.item1", { email: "hearttercompany@gmail.com" }) ||
                  "문의는 이메일(hearttercompany@gmail.com)을 통해 가능합니다."}
              </li>
              <li>{t("article6.item2")}</li>
            </ol>
          </section>

          {/* 동의 버튼 (TermsOfService와의 연계 유지) */}
          {userType && (
            <section className="mt-8">
              <Button
                onClick={handleRegister}
                className="w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                {tLanding("agreeAndRegister") || "동의하고 가입"}
              </Button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PrivacyPolicyContent />
    </Suspense>
  );
}
