// src/context/AuthContext.tsx
"use client";

import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl"; // next-intl 번역 및 로케일
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
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations(); // 네임스페이스 없이 사용
  const locale = useLocale(); // 현재 로케일 가져오기

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setError(t("authError"));
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(t("serverError"));
        router.push(`/${locale}/login`); // 로케일 포함 로그인 페이지로
      } finally {
        setIsLoading(false);
      }
    };

    const EXCLUDED_PATHS = ["", "/login", "/signup", "/church-registration"];

    if (!locale || !pathname) {
      fetchUser(); // 방어 로직: locale 또는 pathname 없으면 기본 호출
    } else if (!EXCLUDED_PATHS.includes(pathname.replace(`/${locale}`, ""))) {
      fetchUser();
    }
  }, [router, pathname, locale]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      router.push("/", { locale: locale });
    } catch (error) {
      console.error("Error logging out:", error);
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
