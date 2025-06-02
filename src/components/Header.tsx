// src/components/Header.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import {
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Settings,
} from "lucide-react";
import Button from "./Button";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { t, i18n } = useTranslation("common");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const langMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭으로 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(event.target as Node)
      ) {
        setIsLangMenuOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target as Node)
      ) {
        setIsSettingsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 언어 전환
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLangMenuOpen(false);
    setIsMenuOpen(false);
  };

  // 메뉴 토글
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // 설정 메뉴 닫기
  const closeSettingsMenu = () => {
    setIsSettingsMenuOpen(false);
    setIsMenuOpen(false); // 모바일 메뉴도 닫기
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          {/* 로고 및 사이트 제목 */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">
                {t("siteTitle", { defaultValue: "Church Management" })}
              </span>
            </Link>
          </div>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex space-x-4 items-center">
            <Link
              href="/"
              className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              {t("home")}
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                {t("dashboard")}
              </Link>
            )}
            {!user && (
              <Link
                href="/church-registration"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                {t("churchRegistration")}
              </Link>
            )}
            {/* 설정 메뉴 */}
            {user && user.role === "SUPER_ADMIN" && (
              <div className="relative" ref={settingsMenuRef}>
                <button
                  onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
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
                      onClick={closeSettingsMenu} // 설정 메뉴 닫기
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
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                {i18n.language === "ko" ? "한국어" : "English"}
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
                    onClick={() => changeLanguage("en")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    English
                  </button>
                </div>
              )}
            </div>
            {/* 사용자 메뉴 */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
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
              onClick={toggleMenu}
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
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-md">
          <nav className="flex flex-col px-4 py-2 space-y-1">
            <Link
              href="/"
              onClick={toggleMenu}
              className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              {t("home")}
            </Link>
            {user && (
              <Link
                href="/dashboard"
                onClick={toggleMenu}
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                {t("dashboard")}
              </Link>
            )}
            {!user && (
              <Link
                href="/church-registration"
                onClick={toggleMenu}
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                {t("churchRegistration")}
              </Link>
            )}
            {user && user.role === "SUPER_ADMIN" && (
              <div className="px-3 py-2">
                <button
                  onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
                  className="flex items-center text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium w-full"
                >
                  <Settings className="w-5 h-5 mr-1" />
                  {t("settings")}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                {isSettingsMenuOpen && (
                  <div className="mt-1 pl-4">
                    <Link
                      href="/master-management"
                      onClick={closeSettingsMenu} // 모바일에서도 설정 메뉴 닫기
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t("masterManagement")}
                    </Link>
                  </div>
                )}
              </div>
            )}
            <div className="px-3 py-2">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium w-full"
              >
                <span className="text-sm font-medium">{t("language")}</span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {isLangMenuOpen && (
                <div className="mt-1 space-y-1 pl-4">
                  <button
                    onClick={() => {
                      changeLanguage("ko");
                      toggleMenu();
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    한국어
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage("en");
                      toggleMenu();
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    English
                  </button>
                </div>
              )}
            </div>
            {user ? (
              <div className="px-3 py-2">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium w-full"
                >
                  <UserIcon className="w-5 h-5 mr-1" />
                  {user.name} ({t(user.role.toLowerCase())})
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                {isUserMenuOpen && (
                  <div className="mt-1 pl-4">
                    <button
                      onClick={() => {
                        logout();
                        toggleMenu();
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
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
                onClick={toggleMenu}
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
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
