// src/utils/getLocalIpAddress.ts
import os from "os";

// 로컬 IP를 취득
export function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    const net = interfaces[name];
    if (!net) continue;

    for (const iface of net) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address; // 예: 192.168.0.10
      }
    }
  }

  return "localhost";
}
