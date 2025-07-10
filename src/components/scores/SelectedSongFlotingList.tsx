// src/components/scores/SelectedSongFlotingList.tsx
"use client";
import { useEffect, useState } from "react";
import MobileSelectedSongList from "./MobileSelectedSongList";
import DesktopSelectedSongList from "./DesktopSelectedSongList";
import { SelectedSong } from "@/types/score";
import { Plan } from "@prisma/client";

interface UsageLimits {
  plan: Plan;
  maxUsers: number;
  remainingUsers: number;
  weeklySetlists: number;
  remainingWeeklySetlists: number;
  monthlySetlists: number;
  remainingMonthlySetlists: number;
  maxScores: number;
  remainingScores: number;
}

interface SelectedSongListProps {
  selectedSongList: SelectedSong[];
  handleRemoveSong: (id: string, index: number) => void;
  locale: string;
  isOpen: boolean;
  toggleOpen: () => void;
  usageLimits: UsageLimits | null;
}

const SelectedSongList = ({
  selectedSongList,
  handleRemoveSong,
  locale,
  isOpen,
  toggleOpen,
  usageLimits,
}: SelectedSongListProps) => {
  const [isDesktop, setIsDesktop] = useState(false);

  // 화면 크기 감지
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768); // md 브레이크포인트
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isDesktop ? (
    <DesktopSelectedSongList
      selectedSongList={selectedSongList}
      handleRemoveSong={handleRemoveSong}
      locale={locale}
      usageLimits={usageLimits}
    />
  ) : (
    <MobileSelectedSongList
      selectedSongList={selectedSongList}
      handleRemoveSong={handleRemoveSong}
      locale={locale}
      isOpen={isOpen}
      toggleOpen={toggleOpen}
      usageLimits={usageLimits}
    />
  );
};

export default SelectedSongList;
