// src/app/[locale]/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import Header from "@/components/Header";
import { AuthProvider } from "@/context/AuthContext";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/lib/GoogleAnalytics";
import { Fragment } from "react";

// 폰트 설정
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 지원하는 로케일
const locales = ["ko", "ja"] as const;
type Locale = (typeof locales)[number];

// 메시지 타입 정의
interface Messages {
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogImageAlt?: string;
  };
  [key: string]: unknown; // any 대신 unknown 사용
}

// Open Graph 이미지 타입 정의
interface NormalizedOGImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

// Twitter 이미지 타입 정규화
type NormalizedTwitterImage = string;

// 로케일별 메타데이터 생성 함수
const getMetadata = (locale: Locale, messages: Messages): Metadata => ({
  title: messages.seo?.title || "charistian | 찬양 콘티/악보 공유 플랫폼",
  description:
    messages.seo?.description || "효율적인 찬양 콘티/악보 공유 플랫폼",
  keywords:
    messages.seo?.keywords ||
    "악보공유, 콘티공유, 콘티, 기독교, 플랫폼, 출석, 일정",
  robots: { index: true, follow: true },
  openGraph: {
    title: messages.seo?.title || "charistian | 찬양 콘티/악보 공유 플랫폼",
    description: messages.seo?.description || "찬양 콘티/악보 공유 플랫폼",
    url: `https://www.charistian.com//${locale}`,
    siteName: "charistian",
    locale: locale === "ko" ? "ko_KR" : "ja_JP",
    images: [
      {
        url: "https://www.charistian.com/images/sns_img.png",
        width: 1200,
        height: 630,
        alt: messages.seo?.ogImageAlt || "charistian 플랫폼 미리보기",
      },
    ],
  },
  twitter: {
    title: messages.seo?.title || "charistian | 찬양 콘티/악보 공유 플랫폼",
    description:
      messages.seo?.description || "효율적인 찬양 콘티/악보 공유 플랫폼",
    images: ["https://www.charistian.com/images/twitter-img.png"],
  },
});

// LayoutProps 인터페이스 정의
interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

// 정적 파라미터 생성
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  // 로케일 유효성 검사
  if (!locales.includes(locale as Locale)) {
    console.warn(`Layout: Invalid locale: ${locale}, triggering 404`);
    notFound();
  }

  // 메시지 로드
  let messages: Messages;
  try {
    messages = (await import(`../../../public/locales/${locale}/common.json`))
      .default;
  } catch (error) {
    console.error(
      `Layout: Failed to load messages for locale: ${locale}`,
      error
    );
    notFound();
  }

  // 메타데이터 생성
  const metadata = getMetadata(locale as Locale, messages);

  // Open Graph 이미지를 정규화
  const ogImages: NormalizedOGImage[] = Array.isArray(
    metadata.openGraph?.images
  )
    ? metadata.openGraph.images.map((img) =>
        typeof img === "string" || img instanceof URL
          ? { url: String(img) }
          : {
              url: String(img.url),
              width:
                typeof img.width === "string" ? Number(img.width) : img.width,
              height:
                typeof img.height === "string"
                  ? Number(img.height)
                  : img.height,
              alt: img.alt,
            }
      )
    : metadata.openGraph?.images
      ? [
          typeof metadata.openGraph.images === "string" ||
          metadata.openGraph.images instanceof URL
            ? { url: String(metadata.openGraph.images) }
            : {
                url: String(metadata.openGraph.images.url),
                width:
                  typeof metadata.openGraph.images.width === "string"
                    ? Number(metadata.openGraph.images.width)
                    : metadata.openGraph.images.width,
                height:
                  typeof metadata.openGraph.images.height === "string"
                    ? Number(metadata.openGraph.images.height)
                    : metadata.openGraph.images.height,
                alt: metadata.openGraph.images.alt,
              },
        ]
      : [];

  // Twitter 이미지를 정규화
  const twitterImages: NormalizedTwitterImage[] = Array.isArray(
    metadata.twitter?.images
  )
    ? metadata.twitter.images.map((img) => String(img))
    : metadata.twitter?.images
      ? [String(metadata.twitter.images)]
      : [];

  // Keywords 정규화
  const keywordsContent = Array.isArray(metadata.keywords)
    ? metadata.keywords.join(", ")
    : metadata.keywords || undefined;

  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{String(metadata.title || "charistian")}</title>
        <meta name="description" content={metadata.description || undefined} />
        <meta name="keywords" content={keywordsContent} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://www.charistian.com//${locale}`} />
        <link
          rel="alternate"
          href="https://www.charistian.com//ko"
          hrefLang="ko"
        />
        <link
          rel="alternate"
          href="https://www.charistian.com//ja"
          hrefLang="ja"
        />
        <link
          rel="alternate"
          href="https://www.charistian.com/"
          hrefLang="x-default"
        />
        <meta
          property="og:title"
          content={String(metadata.openGraph?.title || "charistian")}
        />
        <meta
          property="og:description"
          content={metadata.openGraph?.description || undefined}
        />
        <meta property="og:url" content={String(metadata.openGraph?.url)} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={metadata.openGraph?.locale} />
        <meta property="og:site_name" content={metadata.openGraph?.siteName} />
        {ogImages.map((image, index) => (
          <Fragment key={index}>
            <meta property="og:image" content={image.url} />
            {image.width && (
              <meta property="og:image:width" content={String(image.width)} />
            )}
            {image.height && (
              <meta property="og:image:height" content={String(image.height)} />
            )}
            {image.alt && <meta property="og:image:alt" content={image.alt} />}
          </Fragment>
        ))}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={String(metadata.twitter?.title || "charistian")}
        />
        <meta
          name="twitter:description"
          content={metadata.twitter?.description || undefined}
        />
        {twitterImages.map((image, index) => (
          <meta key={index} name="twitter:image" content={image} />
        ))}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "charistian",
              url: `https://www.charistian.com//${locale}`,
              potentialAction: {
                "@type": "SearchAction",
                target: `https://www.charistian.com//${locale}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS} />
        )}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
