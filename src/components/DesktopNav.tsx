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
import { getPathname } from "@/utils/useRouter";

interface DesktopNavProps {
  user: User | null;
  t: ReturnType<typeof useTranslations>;
  locale: string;
  logout: () => Promise<void>;
  closeSettingsMenu: () => void;
  closeMembersMenu: (path: string) => void;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (open: boolean) => void;
  isSettingsMenuOpen: boolean;
  setIsSettingsMenuOpen: (open: boolean) => void;
  isMembersMenuOpen: boolean;
  setIsMembersMenuOpen: (open: boolean) => void;
  userMenuRef: React.RefObject<HTMLDivElement | null>;
  settingsMenuRef: React.RefObject<HTMLDivElement | null>;
  membersMenuRef: React.RefObject<HTMLDivElement | null>;
}

export default function DesktopNav({
  user,
  t,
  locale,
  logout,
  closeSettingsMenu,
  closeMembersMenu,
  isUserMenuOpen,
  setIsUserMenuOpen,
  isSettingsMenuOpen,
  setIsSettingsMenuOpen,
  isMembersMenuOpen,
  setIsMembersMenuOpen,
  userMenuRef,
  settingsMenuRef,
  membersMenuRef,
}: DesktopNavProps) {
  const closeAllDropdowns = () => {
    setIsUserMenuOpen(false);
    setIsSettingsMenuOpen(false);
    setIsMembersMenuOpen(false);
  };

  return (
    <nav className="hidden md:flex space-x-4 items-center">
      {!user && (
        <Link
          href={getPathname({ locale, href: "/church-registration" })}
          className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
        >
          {t("churchRegistration")}
        </Link>
      )}
      {["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"].includes(user?.role || "") && (
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
                  href={getPathname({ locale, href: "/members" })} // `getPathname`으로 올바른 경로 생성
                  onClick={() => closeMembersMenu("/members")}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {t("memberList")}
                </Link>
                <Link
                  href={getPathname({ locale, href: "/attendance" })}
                  onClick={() => closeMembersMenu("/attendance")}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {t("checkAttendance")}
                </Link>
                <Link
                  href={getPathname({ locale, href: "/attendance-report" })}
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
            <div className="absolute z-50 bg-white shadow-lg rounded-md mt-1 w-25">
              <Link
                href={getPathname({ locale, href: "/master-management" })}
                onClick={closeSettingsMenu}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {t("masterManagement")}
              </Link>
            </div>
          )}
        </div>
      )}
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
        <Link href={getPathname({ locale, href: "/login" })}>
          <Button variant="outline">{t("login")}</Button>
        </Link>
      )}
    </nav>
  );
}
