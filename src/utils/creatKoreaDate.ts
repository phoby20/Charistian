export const createKoreaDate = () => {
  return new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
};
