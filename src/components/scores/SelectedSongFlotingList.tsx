"use client";
import { useEffect, useState } from "react";
import MobileSelectedSongList from "./MobileSelectedSongList";
import DesktopSelectedSongList from "./DesktopSelectedSongList";
import { SelectedSong } from "@/types/score";

interface SelectedSongListProps {
  selectedSongList: SelectedSong[];
  handleRemoveSong: (id: string, index: number) => void;
  locale: string;
  isOpen: boolean;
  toggleOpen: () => void;
}

const SelectedSongList = ({
  selectedSongList,
  handleRemoveSong,
  locale,
  isOpen,
  toggleOpen,
}: SelectedSongListProps) => {
  const [isDesktop, setIsDesktop] = useState(false);

  // 화면 크기 감지
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768); // md 브레이크포인트
    };
    handleResize(); // 초기 실행
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isDesktop ? (
    <DesktopSelectedSongList
      selectedSongList={selectedSongList}
      handleRemoveSong={handleRemoveSong}
      locale={locale}
    />
  ) : (
    <MobileSelectedSongList
      selectedSongList={selectedSongList}
      handleRemoveSong={handleRemoveSong}
      locale={locale}
      isOpen={isOpen}
      toggleOpen={toggleOpen}
    />
  );
};

export default SelectedSongList;
