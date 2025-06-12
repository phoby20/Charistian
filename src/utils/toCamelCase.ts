/**
 * 대문자 스네이크 형식을 소문자 캐멀캐이스로 변경하는 함수
 * @param str
 * @returns
 */
export function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .split("_")
    .map((word, i) => (i ? word[0].toUpperCase() + word.slice(1) : word))
    .join("");
}
