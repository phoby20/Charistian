// src/utils/setlistUtils.ts
import { UsageLimits } from "@/types/score"; // UsageLimits 타입 임포트

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
  return (
    isCreateDisabled &&
    !!usageLimits &&
    (usageLimits.remainingWeeklySetlists >= usageLimits.weeklySetlists ||
      usageLimits.remainingMonthlySetlists >= usageLimits.monthlySetlists)
  );
}
