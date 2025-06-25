import { toZonedTime } from "date-fns-tz";

export const createKoreaDate = (): string => {
  return new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
};

export function getKoreaDate(): Date {
  const now = new Date();
  return toZonedTime(now, "Asia/Seoul");
}
