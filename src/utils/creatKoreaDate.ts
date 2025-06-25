export const createKoreaDate = (): string => {
  return new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
};

export function getKoreaDate(): Date {
  const now = new Date();
  return new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Seoul",
    })
  );
}
