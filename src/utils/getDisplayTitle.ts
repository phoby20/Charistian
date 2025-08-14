// src/utils/getDisplayTitle.ts
// 표시할 제목 선택 헬퍼 함수

export const getDisplayTitle = (
  title: string,
  titleEn: string | null,
  titleJa: string | null,
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

// 새로운 보조 제목 생성 함수
export const getSecondaryTitles = (
  title: string,
  titleEn: string | null,
  titleJa: string | null,
  locale: string
): string[] => {
  const titles: string[] = [];
  if (locale === "ko") {
    if (titleJa) titles.push(titleJa);
    if (titleEn) titles.push(titleEn);
  } else if (locale === "ja") {
    if (title) titles.push(title);
    if (titleEn) titles.push(titleEn);
  } else {
    if (title) titles.push(title);
    if (titleJa) titles.push(titleJa);
  }
  return titles;
};
