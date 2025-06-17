// src/components/Header.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import { useAuth } from "@/context/AuthContext";
import { Menu, X } from "lucide-react";
import { useRouter } from "@/utils/useRouter";

export default function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user, logout } = useAuth();

  // 드롭다운 상태 관리
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isMembersMenuOpen, setIsMembersMenuOpen] = useState(false);
  const [isEventsMenuOpen, setIsEventsMenuOpen] = useState(false);

  // 참조 관리
  const langMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const membersMenuRef = useRef<HTMLDivElement>(null);
  const eventsMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // 모든 드롭다운 메뉴 닫기
  const closeAllDropdowns = () => {
    setIsUserMenuOpen(false);
    setIsSettingsMenuOpen(false);
    setIsMembersMenuOpen(false);
    setIsEventsMenuOpen(false);
  };

  // 외부 클릭으로 드롭다운 및 모바일 메뉴 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (toggleButtonRef.current && toggleButtonRef.current.contains(target))
        return;

      let isOutside = true;
      // DesktopNav 드롭다운 참조만 확인
      if (langMenuRef.current && langMenuRef.current.contains(target))
        isOutside = false;
      if (userMenuRef.current && userMenuRef.current.contains(target))
        isOutside = false;
      if (settingsMenuRef.current && settingsMenuRef.current.contains(target))
        isOutside = false;
      if (membersMenuRef.current && membersMenuRef.current.contains(target))
        isOutside = false;
      if (eventsMenuRef.current && eventsMenuRef.current.contains(target))
        isOutside = false;
      // MobileNav 메뉴 확인
      if (mobileMenuRef.current && mobileMenuRef.current.contains(target))
        isOutside = false;

      if (isOutside) {
        closeAllDropdowns();
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // 설정 메뉴 닫기 및 내비게이션
  const closeSettingsMenu = () => {
    closeAllDropdowns();
    setIsMenuOpen(false);
    router.push("/master-management");
  };

  // 멤버 메뉴 닫기 및 내비게이션
  const closeMembersMenu = (path: string) => {
    closeAllDropdowns();
    setIsMenuOpen(false);
    router.push(path);
  };

  const openMobileMenu = (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    setIsMenuOpen(true);
  };

  const closeMobileMenu = (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    setIsMenuOpen(false);
  };

  // 로고 클릭 시 이동 경로 결정
  const logoHref = user ? `/${locale}/dashboard` : "/";

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          {/* 로고 및 사이트 제목 */}
          <div className="flex-shrink-0 flex items-center">
            <Link href={logoHref} className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">
                {t("siteTitle", { defaultValue: "Charistian" })}
              </span>
            </Link>
          </div>

          {/* 네비게이션 */}
          <DesktopNav
            user={user}
            t={t}
            locale={locale}
            logout={logout}
            closeSettingsMenu={closeSettingsMenu}
            closeMembersMenu={closeMembersMenu}
            isUserMenuOpen={isUserMenuOpen}
            setIsUserMenuOpen={setIsUserMenuOpen}
            isSettingsMenuOpen={isSettingsMenuOpen}
            setIsSettingsMenuOpen={setIsSettingsMenuOpen}
            isMembersMenuOpen={isMembersMenuOpen}
            setIsMembersMenuOpen={setIsMembersMenuOpen}
            setIsEventsMenuOpen={setIsEventsMenuOpen}
            userMenuRef={userMenuRef}
            settingsMenuRef={settingsMenuRef}
            membersMenuRef={membersMenuRef}
          />

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden flex items-center">
            <button
              ref={toggleButtonRef}
              onClick={isMenuOpen ? closeMobileMenu : openMobileMenu}
              className="text-gray-600 hover:text-blue-600 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 네비게이션 */}
      <MobileNav
        user={user}
        t={t}
        locale={locale}
        logout={logout}
        closeSettingsMenu={closeSettingsMenu}
        closeMembersMenu={closeMembersMenu}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        isUserMenuOpen={isUserMenuOpen}
        setIsUserMenuOpen={setIsUserMenuOpen}
        isSettingsMenuOpen={isSettingsMenuOpen}
        setIsSettingsMenuOpen={setIsSettingsMenuOpen}
        isMembersMenuOpen={isMembersMenuOpen}
        setIsMembersMenuOpen={setIsMembersMenuOpen}
        isEventsMenuOpen={isEventsMenuOpen}
        setIsEventsMenuOpen={setIsEventsMenuOpen}
        mobileMenuRef={mobileMenuRef}
        eventsMenuRef={eventsMenuRef}
      />
    </header>
  );
}
