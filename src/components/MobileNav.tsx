// src/components/MobileNav.tsx
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  User as UserIcon,
  LogOut,
  ChevronDown,
  Settings,
  UsersRound,
  Calendar,
  User2,
  FileMusic,
} from "lucide-react";
import { User } from "@prisma/client";
import { getPathname } from "@/utils/useRouter";
import { toCamelCase } from "@/utils/toCamelCase";

interface MobileNavProps {
  user: User | null;
  t: ReturnType<typeof useTranslations>;
  locale: string;
  logout: () => Promise<void>;
  closeSettingsMenu: () => void;
  closeMembersMenu: (path: string) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (open: boolean) => void;
  isSettingsMenuOpen: boolean;
  setIsSettingsMenuOpen: (open: boolean) => void;
  isMembersMenuOpen: boolean;
  setIsMembersMenuOpen: (open: boolean) => void;
  isEventsMenuOpen: boolean;
  setIsEventsMenuOpen: (open: boolean) => void;
  isScoresMenuOpen: boolean;
  setIsScoresMenuOpen: (open: boolean) => void;
  mobileMenuRef: React.RefObject<HTMLDivElement | null>;
  eventsMenuRef: React.RefObject<HTMLDivElement | null>;
  scoresMenuRef: React.RefObject<HTMLDivElement | null>;
  isKakaoEmail: boolean;
}

export default function MobileNav({
  user,
  t,
  locale,
  logout,
  closeSettingsMenu,
  closeMembersMenu,
  isMenuOpen,
  setIsMenuOpen,
  isUserMenuOpen,
  setIsUserMenuOpen,
  isSettingsMenuOpen,
  setIsSettingsMenuOpen,
  isMembersMenuOpen,
  setIsMembersMenuOpen,
  isEventsMenuOpen,
  setIsEventsMenuOpen,
  isScoresMenuOpen,
  setIsScoresMenuOpen,
  mobileMenuRef,
  eventsMenuRef,
  scoresMenuRef,
  isKakaoEmail,
}: MobileNavProps) {
  const closeAllDropdowns = () => {
    setIsUserMenuOpen(false);
    setIsSettingsMenuOpen(false);
    setIsMembersMenuOpen(false);
    setIsEventsMenuOpen(false);
    setIsScoresMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-md" ref={mobileMenuRef}>
          <nav className="flex flex-col px-4 py-4 space-y-1">
            {["SUPER_ADMIN", "ADMIN", "SUB_ADMIN"].includes(
              user?.role || ""
            ) && (
              <>
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
                        href={getPathname({ locale, href: "/members" })}
                        onClick={() => closeMembersMenu("/members")}
                        className="block w-full text-left px-4 py-4 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {t("memberList")}
                      </Link>
                      <Link
                        href={getPathname({ locale, href: "/attendance" })}
                        onClick={() => closeMembersMenu("/attendance")}
                        className="block w-full text-left px-4 py-4 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {t("checkAttendance")}
                      </Link>
                      <Link
                        href={getPathname({
                          locale,
                          href: "/attendance-report",
                        })}
                        onClick={() => closeMembersMenu("/attendance-report")}
                        className="block w-full text-left px-4 py-4 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {t("attendanceReport")}
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Scores Menu */}
            {["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "GENERAL"].includes(
              user?.role || ""
            ) &&
              !isKakaoEmail && (
                <div className="px-3 py-2" ref={scoresMenuRef}>
                  <button
                    onClick={() => {
                      closeAllDropdowns();
                      setIsScoresMenuOpen(!isScoresMenuOpen);
                    }}
                    className="flex items-center text-gray-600 hover:text-blue-600 py-2 rounded-md text-sm font-medium w-full"
                  >
                    <FileMusic className="w-5 h-5 mr-2" />
                    {t("scores")}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </button>
                  {isScoresMenuOpen && (
                    <div className="mt-2 pl-4">
                      <Link
                        href={getPathname({ locale, href: "/scores" })}
                        onClick={() => {
                          closeAllDropdowns();
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-4 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {t("scoreList")}
                      </Link>
                      <Link
                        href={getPathname({ locale, href: "/setlists" })}
                        onClick={() => {
                          closeAllDropdowns();
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-4 text-sm text-gray-700 hover:bg-gray-100"
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
              !isKakaoEmail && (
                <div className="px-3 py-2" ref={eventsMenuRef}>
                  <button
                    onClick={() => {
                      closeAllDropdowns();
                      setIsEventsMenuOpen(!isEventsMenuOpen);
                    }}
                    className="flex items-center text-gray-600 hover:text-blue-600 py-2 rounded-md text-sm font-medium w-full"
                  >
                    <Calendar className="w-5 h-5 mr-1" />
                    {t("calendar")}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  {isEventsMenuOpen && (
                    <div className="mt-2 pl-4">
                      <Link
                        href={getPathname({ locale, href: "/calendar" })}
                        onClick={() => closeMembersMenu("/calendar")}
                        className="block w-full text-left px-4 py-4 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {t("calendar")}
                      </Link>
                    </div>
                  )}
                </div>
              )}

            {!user && (
              <>
                <Link
                  href={getPathname({
                    locale,
                    href: "/terms-of-service?type=church",
                  })}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-600 hover:text-blue-600 px-4 py-4 rounded-md text-sm font-medium"
                >
                  {t("churchRegistration.title")}
                </Link>
              </>
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
                      href={getPathname({ locale, href: "/master-management" })}
                      onClick={closeSettingsMenu}
                      className="block w-full text-left px-4 py-4 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t("masterManagement")}
                    </Link>
                  </div>
                )}
              </div>
            )}

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
                  {user.name} ({t(toCamelCase(user.role))})
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                {isUserMenuOpen && (
                  <div className="mt-2 pl-4">
                    {user.churchId && !isKakaoEmail && (
                      <Link
                        href={getPathname({ locale, href: "/mypage" })}
                        onClick={() => {
                          closeAllDropdowns();
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-4 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <User2 className="w-4 h-4 mr-2" />
                        {t("MyPage.title")}
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-4 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={getPathname({ locale, href: "/login" })}
                onClick={() => setIsMenuOpen(false)}
                className="block text-gray-600 hover:text-blue-600 px-4 py-4 rounded-md text-sm font-medium"
              >
                {t("login.title")}
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
