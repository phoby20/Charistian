// 표시할 제목 선택 헬퍼 함수

export const getDisplayTitle = (
  title: string,
  titleEn: string,
  titleJa: string,
  locale: string
): string => {
  if (locale === "ko") {
    return title || titleEn || titleJa || "";
  } else if (locale === "ja") {
    return titleJa || titleEn || title || "";
  } else {
    return titleEn || title || titleJa || "";
  }
};
