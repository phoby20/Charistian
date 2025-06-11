// src/components/MyQRCode.tsx
"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { User } from "@prisma/client";
import { useTranslations } from "next-intl";

interface MyQRCodeProps {
  user: User;
  scanMessage: string; // 상위에서 전달된 메시지
}

export default function MyQRCode({ user, scanMessage }: MyQRCodeProps) {
  const t = useTranslations();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && user.id && user.churchId) {
      const qrData = JSON.stringify({
        userId: user.id,
        churchId: user.churchId,
      });

      QRCode.toDataURL(qrData, { width: 300, margin: 2 }, (err, url) => {
        if (err) {
          console.error("Error generating QR code:", err);
          return;
        }
        setQrCodeUrl(url);
      });
    }
  }, [isOpen, user.id, user.churchId]);

  if (!["GENERAL", "ADMIN", "SUB_ADMIN"].includes(user.role)) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
      >
        {t("myQRCode")}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">{t("myQRCode")}</h2>
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="My QR Code" className="mx-auto" />
            ) : (
              <p className="text-center text-gray-500">{t("generatingQR")}</p>
            )}
            {scanMessage && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg text-center">
                <p className="text-lg">{scanMessage}</p>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition duration-200"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
