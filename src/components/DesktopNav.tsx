// src/components/DesktopNav.tsx
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  LogOut,
  ChevronDown,
  Settings,
  UsersRound,
  Calendar,
  User2,
  FileMusic,
} from "lucide-react";
import Button from "./Button";
import { User } from "@prisma/client";
import { getPathname } from "@/utils/useRouter";
import { toCamelCase } from "@/utils/toCamelCase";
import Image from "next/image";

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
  setIsEventsMenuOpen: (open: boolean) => void;
  isScoresMenuOpen: boolean;
  setIsScoresMenuOpen: (open: boolean) => void;
  userMenuRef: React.RefObject<HTMLDivElement | null>;
  settingsMenuRef: React.RefObject<HTMLDivElement | null>;
  membersMenuRef: React.RefObject<HTMLDivElement | null>;
  scoresMenuRef: React.RefObject<HTMLDivElement | null>;
  isKakaoEmail: boolean;
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
  setIsEventsMenuOpen,
  isScoresMenuOpen,
  setIsScoresMenuOpen,
  userMenuRef,
  settingsMenuRef,
  membersMenuRef,
  scoresMenuRef,
  isKakaoEmail,
}: DesktopNavProps) {
  const closeAllDropdowns = () => {
    setIsUserMenuOpen(false);
    setIsSettingsMenuOpen(false);
    setIsMembersMenuOpen(false);
    setIsEventsMenuOpen(false);
    setIsScoresMenuOpen(false);
  };

  return (
    <nav className="hidden md:flex space-x-1 items-center">
      {!user && (
        <Link
          href={getPathname({ locale, href: "/terms-of-service?type=church" })}
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
              className="cursor-pointer flex items-center text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              <UsersRound className="w-5 h-5 mr-1" />
              {t("members")}
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            {isMembersMenuOpen && (
              <div className="absolute z-50 bg-white shadow-lg rounded-md mt-1">
                <Link
                  href={getPathname({ locale, href: "/members" })}
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

      {/* Scores Dropdown */}
      {["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "GENERAL"].includes(
        user?.role || ""
      ) &&
        user?.churchId &&
        !isKakaoEmail && (
          <div className="relative" ref={scoresMenuRef}>
            <button
              onClick={() => {
                closeAllDropdowns();
                setIsScoresMenuOpen(!isScoresMenuOpen);
              }}
              className="cursor-pointer flex items-center text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              <FileMusic className="w-5 h-5 mr-1" />
              {t("scores")}
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            {isScoresMenuOpen && (
              <div className="absolute z-50 bg-white shadow-lg rounded-md mt-1">
                <Link
                  href={getPathname({ locale, href: "/scores" })}
                  onClick={closeAllDropdowns}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {t("scoreList")}
                </Link>
                <Link
                  href={getPathname({ locale, href: "/setlists" })}
                  onClick={closeAllDropdowns}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {t("setlistList")}
                </Link>
              </div>
            )}
          </div>
        )}

      {/* Calendar Menu */}
      {["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "GENERAL"].includes(
        user?.role || ""
      ) &&
        user?.churchId &&
        !isKakaoEmail && (
          <Link
            href={getPathname({ locale, href: "/calendar" })}
            className="text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
          >
            <div className="flex">
              <Calendar className="w-5 h-5 mr-1" />
              {t("calendar")}
            </div>
          </Link>
        )}

      {/* Settings Menu */}
      {user && user.role === "SUPER_ADMIN" && (
        <div className="relative" ref={settingsMenuRef}>
          <button
            onClick={() => {
              closeAllDropdowns();
              setIsSettingsMenuOpen(!isSettingsMenuOpen);
            }}
            className="cursor-pointer flex items-center text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
          >
            <Settings className="w-5 h-5 mr-1" />
            {t("settings")}
            <ChevronDown className="w-4 h-4 ml-1" />
          </button>
          {isSettingsMenuOpen && (
            <div className="absolute z-50 bg-white shadow-lg rounded-md mt-1 w-30">
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
      {/* User Menu */}
      {user ? (
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              closeAllDropdowns();
              setIsUserMenuOpen(!isUserMenuOpen);
            }}
            className="cursor-pointer flex items-center text-gray-600 hover:text-red-600 py-2 rounded-md text-sm font-medium"
          >
            <Image
              src={user?.profileImage || "/header_user_img.png"}
              alt="header_user_img"
              width={36}
              height={36}
              className="rounded-full"
            />
          </button>
          {isUserMenuOpen && (
            <div className="absolute right-0 z-50 bg-white shadow-lg rounded-md mt-1 w-fill min-w-46">
              <p className="text-sm px-4 py-2 text-center mb-2">
                {user.name} ({t(toCamelCase(user.role))})
              </p>
              {user.churchId && !isKakaoEmail && (
                <Link
                  href={getPathname({ locale, href: "/mypage" })}
                  onClick={() => closeAllDropdowns()}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <User2 className="w-4 h-4 mr-2" />
                  {t("MyPage.title")}
                </Link>
              )}
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
          <Button variant="outline">{t("login.title")}</Button>
        </Link>
      )}
    </nav>
  );
}
