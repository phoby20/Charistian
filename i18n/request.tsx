// i18n/request.tsx
import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

// 지원하는 로케일
const locales = ["ko", "ja", "en"] as const;
type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }: { locale?: string }) => {
  // 로케일 유효성 검사
  if (!locale || !locales.includes(locale as Locale)) {
    // console.warn(
    //   `Invalid locale: ${locale || "undefined"}, falling back to 'ko'`
    // );
    locale = "ko"; // 기본 로케일로 대체
  }

  // /messages 디렉토리에서 번역 파일 로드
  try {
    const messages = (await import(`../public/locales/${locale}/common.json`))
      .default;
    return {
      locale, // RequestConfig에 필수
      messages,
    };
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    notFound();
  }
});
