// src/context/AuthContext.tsx
"use client";

import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { User } from "@prisma/client";
import { useRouter } from "@/utils/useRouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  setError: Dispatch<SetStateAction<string | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();

  // fetchUser 메모이제이션
  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setError(null);
      } else {
        setError(t("authError"));
        // 루트 경로(/)에서는 리다이렉트 생략
        if (
          pathname !== `/${locale}` &&
          pathname !== `/${locale}/signup` &&
          pathname !== `/${locale}/church-registration` &&
          pathname !== `/${locale}/reset-password` &&
          pathname !== `/${locale}/reset-password/confirm`
        ) {
          router.replace(`/login`);
        }
      }
    } catch (err) {
      console.error("Fetch user error:", err);
      setError(t("serverError"));
      if (pathname !== "/") {
        router.replace(`/login`);
      }
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [router, pathname, t]);

  useEffect(() => {
    const EXCLUDED_PATHS = [
      "/login",
      "/signup",
      "/church-registration",
      "/church-registration/success",
      "/signup/complete",
      "/reset-password",
      "/reset-password/confirm",
    ];

    if (!pathname || !locale) {
      console.error("Missing pathname or locale, triggering fetchUser");
      fetchUser();
      return;
    }

    // cleanPath 계산
    const cleanPath = pathname.startsWith(`/${locale}`)
      ? pathname.replace(`/${locale}`, "") || "/"
      : pathname;

    // 로그인한 사용자가 EXCLUDED_PATHS에 접근 시 /로 리다이렉트
    if (!isLoading && user && EXCLUDED_PATHS.includes(cleanPath)) {
      router.replace("/");
      return;
    }

    // 초기 인증 체크
    if (!user && !hasFetched) {
      fetchUser();
    } else if (user || error) {
      setIsLoading(false);
    }
  }, [pathname, locale, user, isLoading, hasFetched, error, fetchUser, router]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setHasFetched(false);
      setError(null);
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
      setError(t("serverError"));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
