"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useRouter } from "@/utils/useRouter";
// import Link from "next/link";

export default function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const langButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(target) &&
        langButtonRef.current &&
        !langButtonRef.current.contains(target)
      ) {
        setIsLangMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const changeLanguage = (lng: string) => {
    let cleanedPathname = pathname.replace(/^\/[^/]+/, "");
    if (cleanedPathname === "" || pathname.match(/^\/(ko|ja|en)$/)) {
      cleanedPathname = "/";
    }
    try {
      router.push(cleanedPathname, { locale: lng });
    } catch (error) {
      console.error("Router push failed:", error);
      window.location.href = `/${lng}${cleanedPathname}`;
    }
    setIsLangMenuOpen(false);
  };

  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-lg font-semibold mb-4">{t("brandName")}</h4>
            <p className="text-gray-400">{t("description")}</p>
          </div>
          {/* <div>
            <h4 className="text-lg font-semibold mb-4">{t("links")}</h4>

            <div className="mt-4">
              <Link
                href={`/${locale}/specified-commercial-transaction`}
                className="text-gray-400 hover:text-white font-medium"
              >
                {t("specifiedCommercialTransaction") ||
                  "特定商取引法に基づく表記"}
              </Link>
            </div>
            <div className="mt-4">
              <Link
                href={`/${locale}/privacy-policy`}
                className="text-gray-400 hover:text-white font-medium"
              >
                {t("privacy") || "개인정보처리방침"}
              </Link>
            </div>
            <div className="mt-4">
              <Link
                href={`/${locale}/terms-of-service`}
                className="text-gray-400 hover:text-white font-medium"
              >
                {t("termsOfService") || "이용약관"}
              </Link>
            </div>
          </div> */}
          {/* <div>
            <h4 className="text-lg font-semibold mb-4">{t("contact")}</h4>
            <Link
              href={`/${locale}/contact`}
              className="text-gray-400 hover:text-white font-medium"
            >
              {t("contactLink") || "문의하기"}
            </Link>
          </div> */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Language</h4>
            <div className="relative" ref={langMenuRef}>
              <button
                ref={langButtonRef}
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="cursor-pointer flex items-center text-gray-400 hover:text-white font-medium"
                aria-expanded={isLangMenuOpen}
                aria-haspopup="true"
              >
                {locale === "ko"
                  ? "한국어"
                  : locale === "ja"
                    ? "日本語"
                    : "English"}
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {isLangMenuOpen && (
                <ul
                  className="absolute left-0 mt-2 w-32 bg-white text-gray-900 rounded-md shadow-lg z-10"
                  role="menu"
                >
                  <li>
                    <button
                      onClick={() => changeLanguage("ko")}
                      className="cursor-pointer block w-full text-left px-4 py-2 hover:bg-gray-100"
                      role="menuitem"
                    >
                      한국어
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => changeLanguage("ja")}
                      className="cursor-pointer block w-full text-left px-4 py-2 hover:bg-gray-100"
                      role="menuitem"
                    >
                      日本語
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => changeLanguage("en")}
                      className="cursor-pointer block w-full text-left px-4 py-2 hover:bg-gray-100"
                      role="menuitem"
                    >
                      English
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 text-center text-gray-500">
          © {new Date().getFullYear()} Integrity,. All Rights Reserved.
        </div>
        {/* <p className="mt-1 text-center text-gray-500">
          Room 101, Lehua Minami-Tokiwadai, 1-11-6 Minami-Tokiwadai,
          Itabashi-ku, Tokyo 174-0072, Japan
        </p> */}
      </div>
    </footer>
  );
}
