// src/components/DesktopNav.tsx
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  User as UserIcon,
  LogOut,
  ChevronDown,
  Settings,
  UsersRound,
} from "lucide-react";
import Button from "./Button";
import { User } from "@prisma/client";

interface DesktopNavProps {
  user: User | null;
  t: ReturnType<typeof useTranslations>;
  locale: string;
  logout: () => Promise<void>;
  changeLanguage: (lng: string) => void;
  closeSettingsMenu: () => void;
  closeMembersMenu: (path: string) => void;
  isLangMenuOpen: boolean;
  setIsLangMenuOpen: (open: boolean) => void;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (open: boolean) => void;
  isSettingsMenuOpen: boolean;
  setIsSettingsMenuOpen: (open: boolean) => void;
  isMembersMenuOpen: boolean;
  setIsMembersMenuOpen: (open: boolean) => void;
  langMenuRef: React.RefObject<HTMLDivElement | null>;
  userMenuRef: React.RefObject<HTMLDivElement | null>;
  settingsMenuRef: React.RefObject<HTMLDivElement | null>;
  membersMenuRef: React.RefObject<HTMLDivElement | null>;
}

export default function DesktopNav({
  user,
  t,
  locale,
  logout,
  changeLanguage,
  closeSettingsMenu,
  closeMembersMenu,
  isLangMenuOpen,
  setIsLangMenuOpen,
  isUserMenuOpen,
  setIsUserMenuOpen,
  isSettingsMenuOpen,
  setIsSettingsMenuOpen,
  isMembersMenuOpen,
  setIsMembersMenuOpen,
  langMenuRef,
  userMenuRef,
  settingsMenuRef,
  membersMenuRef,
}: DesktopNavProps) {
  const closeAllDropdowns = () => {
    setIsLangMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsSettingsMenuOpen(false);
    setIsMembersMenuOpen(false);
  };

  return (
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
          {locale === "ko" ? "한국어" : "日本語"}
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
        <Link href={`/${locale}/login`}>
          <Button variant="outline">{t("login")}</Button>
        </Link>
      )}
    </nav>
  );
}
