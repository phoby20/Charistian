"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Settings,
  UsersRound,
  UserCheck,
  Globe,
} from "lucide-react";
import Button from "./Button";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { t, i18n } = useTranslation("common");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isMembersMenuOpen, setIsMembersMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const langMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const membersMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // 모든 드롭다운 메뉴 닫기
  const closeAllDropdowns = () => {
    setIsLangMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsSettingsMenuOpen(false);
    setIsMembersMenuOpen(false);
  };

  // 외부 클릭으로 드롭다운 및 모바일 메뉴 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;

      // 토글 버튼 클릭은 무시
      if (toggleButtonRef.current && toggleButtonRef.current.contains(target)) {
        return;
      }

      let isOutside = true;

      if (langMenuRef.current && langMenuRef.current.contains(target)) {
        isOutside = false;
      }
      if (userMenuRef.current && userMenuRef.current.contains(target)) {
        isOutside = false;
      }
      if (settingsMenuRef.current && settingsMenuRef.current.contains(target)) {
        isOutside = false;
      }
      if (membersMenuRef.current && membersMenuRef.current.contains(target)) {
        isOutside = false;
      }
      if (mobileMenuRef.current && mobileMenuRef.current.contains(target)) {
        isOutside = false;
      }

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

  // 언어 전환
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    closeAllDropdowns();
    setIsMenuOpen(false);
  };

  // 모바일 메뉴 열기
  const openMobileMenu = (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    setIsMenuOpen(true);
  };

  // 모바일 메뉴 닫기
  const closeMobileMenu = (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    setIsMenuOpen(false);
  };

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

  // 로고 클릭 시 이동 경로 결정
  const logoHref = user ? "/dashboard" : "/";

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          {/* 로고 및 사이트 제목 */}
          <div className="flex-shrink-0 flex items-center">
            <Link href={logoHref} className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">
                {t("siteTitle", { defaultValue: "ChurchM" })}
              </span>
            </Link>
          </div>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex space-x-4 items-center">
            {!user && (
              <Link
                href="/church-registration"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                {t("churchRegistration")}
              </Link>
            )}
            {user && (
              <>
                {/* Members Dropdown */}
                <div className="relative" ref={membersMenuRef}>
                  <button
                    onClick={() => {
                      closeAllDropdowns();
                      setIsMembersMenuOpen(!isMembersMenuOpen);
                    }}
                    className="flex items-center text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <UsersRound className="w-5 h-5 mr-1" />
                    {t("members")}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  {isMembersMenuOpen && (
                    <div className="absolute z-50 bg-white shadow-lg rounded-md mt-1">
                      <Link
                        href="/members"
                        onClick={() => closeMembersMenu("/members")}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {t("memberList")}
                      </Link>
                      <Link
                        href="/attendance"
                        onClick={() => closeMembersMenu("/attendance")}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {t("checkAttendance")}
                      </Link>
                      <Link
                        href="/attendance-report"
                        onClick={() => closeMembersMenu("/attendance-report")}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {t("attendanceReport")}
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
            {/* 설정 메뉴 */}
            {user && user.role === "SUPER_ADMIN" && (
              <div className="relative" ref={settingsMenuRef}>
                <button
                  onClick={() => {
                    closeAllDropdowns();
                    setIsSettingsMenuOpen(!isSettingsMenuOpen);
                  }}
                  className="flex items-center text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <Settings className="w-5 h-5 mr-1" />
                  {t("settings")}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                {isSettingsMenuOpen && (
                  <div className="absolute z-50 bg-white shadow-lg rounded-md mt-1">
                    <Link
                      href="/master-management"
                      onClick={closeSettingsMenu}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t("masterManagement")}
                    </Link>
                  </div>
                )}
              </div>
            )}
            {/* 언어 선택 */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => {
                  closeAllDropdowns();
                  setIsLangMenuOpen(!isLangMenuOpen);
                }}
                className="flex items-center text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                {i18n.language === "ko" ? "한국어" : "日本語"}
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {isLangMenuOpen && (
                <div className="absolute z-50 bg-white shadow-lg rounded-md mt-1">
                  <button
                    onClick={() => changeLanguage("ko")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    한국어
                  </button>
                  <button
                    onClick={() => changeLanguage("ja")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    日本語
                  </button>
                </div>
              )}
            </div>
            {/* 사용자 메뉴 */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => {
                    closeAllDropdowns();
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }}
                  className="flex items-center text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <UserIcon className="w-5 h-5 mr-1" />
                  {user.name} ({t(user.role.toLowerCase())})
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 z-50 bg-white shadow-lg rounded-md mt-1">
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <Button variant="outline">{t("login")}</Button>
              </Link>
            )}
          </nav>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden flex items-center">
            <button
              ref={toggleButtonRef}
              onClick={isMenuOpen ? closeMobileMenu : openMobileMenu}
              className="text-gray-600 hover:text-blue-600 focus:outline-none"
              aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
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
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-md" ref={mobileMenuRef}>
          <nav className="flex flex-col px-4 py-2 space-y-1">
            {user && (
              <>
                <Link
                  href="/attendance"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <UserCheck className="w-5 h-5 mr-1" />
                  {t("attendance")}
                </Link>
                {/* Mobile Members Dropdown */}
                <div className="px-3 py-2">
                  <button
                    onClick={() => {
                      closeAllDropdowns();
                      setIsMembersMenuOpen(!isMembersMenuOpen);
                    }}
                    className="flex items-center text-gray-600 hover:text-blue-600 py-2 rounded-md text-sm font-medium w-full"
                  >
                    <UsersRound className="w-5 h-5 mr-2" />
                    {t("members")}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </button>
                  {isMembersMenuOpen && (
                    <div className="mt-2 pl-4">
                      <Link
                        href="/members"
                        onClick={() => closeMembersMenu("/members")}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {t("memberList")}
                      </Link>
                      <Link
                        href="/attendance"
                        onClick={() => closeMembersMenu("/attendance")}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {t("checkAttendance")}
                      </Link>
                      <Link
                        href="/attendance-report"
                        onClick={() => closeMembersMenu("/attendance-report")}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {t("attendanceReport")}
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
            {!user && (
              <Link
                href="/church-registration"
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-600 hover:text-blue-600 px-4 py-2 rounded-md text-sm font-medium"
              >
                {t("churchRegistration")}
              </Link>
            )}
            {user && user.role === "SUPER_ADMIN" && (
              <div className="px-3 py-2">
                <button
                  onClick={() => {
                    closeAllDropdowns();
                    setIsSettingsMenuOpen(!isSettingsMenuOpen);
                  }}
                  className="flex items-center text-gray-600 hover:text-blue-600 py-2 rounded-md text-sm font-medium w-full"
                >
                  <Settings className="w-5 h-5 mr-2" />
                  {t("settings")}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                {isSettingsMenuOpen && (
                  <div className="mt-2 pl-4">
                    <Link
                      href="/master-management"
                      onClick={closeSettingsMenu}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t("masterManagement")}
                    </Link>
                  </div>
                )}
              </div>
            )}
            <div className="px-3 py-2">
              <button
                onClick={() => {
                  closeAllDropdowns();
                  setIsLangMenuOpen(!isLangMenuOpen);
                }}
                className="flex items-center text-gray-600 hover:text-blue-600 py-2 rounded-md text-sm font-medium w-full"
              >
                <span className="flex items-center text-sm font-medium">
                  <Globe className="w-5 h-5 mr-2" />
                  {t("language")}
                </span>
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
              {isLangMenuOpen && (
                <div className="mt-2 pl-4">
                  <button
                    onClick={() => {
                      changeLanguage("ko");
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    한국어
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage("ja");
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    日本語
                  </button>
                </div>
              )}
            </div>
            {user ? (
              <div className="px-3 py-2">
                <button
                  onClick={() => {
                    closeAllDropdowns();
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }}
                  className="flex items-center text-gray-600 hover:text-blue-600 py-2 rounded-md text-sm font-medium w-full"
                >
                  <UserIcon className="w-5 h-5 mr-2" />
                  {user.name} ({t(user.role.toLowerCase())})
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                {isUserMenuOpen && (
                  <div className="mt-2 pl-4">
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block text-gray-600 hover:text-blue-600 px-4 py-2 rounded-md text-sm font-medium"
              >
                {t("login")}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
