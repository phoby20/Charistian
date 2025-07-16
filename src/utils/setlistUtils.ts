// src/utils/setlistUtils.ts
import { UsageLimits } from "@/types/score";

// 세트리스트 생성 버튼 비활성화 여부 확인
export function isSetlistCreationDisabled(
  selectedSongList: {
    id: string;
    title: string;
    titleEn: string;
    titleJa: string;
  }[],
  usageLimits: UsageLimits | null
): boolean {
  // ENTERPRISE 플랜인 경우 항상 활성화 (false 반환)
  if (selectedSongList.length > 0 && usageLimits?.plan === "ENTERPRISE") {
    return false;
  }

  // 그 외의 경우 기존 조건 확인
  return (
    selectedSongList.length === 0 ||
    (usageLimits
      ? usageLimits.remainingWeeklySetlists >= usageLimits.weeklySetlists ||
        usageLimits.remainingMonthlySetlists >= usageLimits.monthlySetlists
      : false)
  );
}

// 업그레이드 버튼 표시 여부 확인
export function shouldShowUpgradeButton(
  isCreateDisabled: boolean,
  usageLimits: UsageLimits | null
): boolean {
  // ENTERPRISE 플랜인 경우 항상 비표시 (false 반환)
  if (usageLimits?.plan === "ENTERPRISE") {
    return false;
  }

  // 그 외의 경우 기존 조건 확인
  return (
    isCreateDisabled &&
    !!usageLimits &&
    (usageLimits.remainingWeeklySetlists >= usageLimits.weeklySetlists ||
      usageLimits.remainingMonthlySetlists >= usageLimits.monthlySetlists)
  );
}
