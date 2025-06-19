// src/components/MyQRCode.tsx
"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { User } from "@prisma/client";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface MyQRCodeProps {
  user: User & { groups: { id: string }[] };
  scanMessage: string;
}

export default function MyQRCode({ user, scanMessage }: MyQRCodeProps) {
  const t = useTranslations();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [churchName, setChurchName] = useState<string>(t("noChurch"));
  const [positionName, setPositionName] = useState<string>(t("noPosition"));
  const [groupName, setGroupName] = useState<string>(t("noGroup"));

  useEffect(() => {
    if (isOpen && user.id && user.churchId) {
      const qrData = JSON.stringify({
        userId: user.id,
        churchId: user.churchId,
      });

      QRCode.toDataURL(qrData, { width: 200, margin: 2 }, (err, url) => {
        if (err) {
          console.error("Error generating QR code:", err);
          return;
        }
        setQrCodeUrl(url);
      });
    }
  }, [isOpen, user.id, user.churchId]);

  useEffect(() => {
    if (user.churchId) {
      fetch(`/api/church/${user.churchId}`)
        .then((res) => res.json())
        .then((data) => setChurchName(data.name || t("noChurch")))
        .catch(() => setChurchName(t("noChurch")));
    }
  }, [user.churchId]);

  useEffect(() => {
    if (user.position) {
      fetch(`/api/position/${user.position}`)
        .then((res) => res.json())
        .then((data) => setPositionName(data.name || t("unknownPosition")));
    }
  }, [user.position]);

  useEffect(() => {
    if (user.groups[0].id) {
      fetch(`/api/group/${user.groups[0].id}`)
        .then((res) => res.json())
        .then((data) => setGroupName(data.name || t("noGroup")));
    }
  }, [user.position]);

  if (!["GENERAL", "ADMIN", "SUB_ADMIN"].includes(user.role)) {
    return null;
  }

  // 기본 이미지 설정
  const defaultProfileImage = "/default_user.png";
  const profileImage = user.profileImage || defaultProfileImage;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
      >
        {t("membershipCard")}
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
          <div className="relative bg-white p-6 rounded-xl shadow-2xl w-90 max-w-sm flex flex-col items-center border border-gray-400">
            {/* "X" 버튼 */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-200 text-gray-800 rounded-full flex items-center justify-center hover:bg-gray-300 transition duration-200"
            >
              X
            </button>
            {/* 검은색 라운드 박스 */}
            <div className="h-[10px] w-[60px] bg-gray-100 border border-gray-400 rounded-full mx-auto mb-10"></div>

            {/* 성도증 타이틀 */}
            <h2 className="text-3xl font-bold text-gray-800 mb-10">
              {t("membershipCard")}
            </h2>

            {/* 회원 사진 */}
            <div className="relative w-24 h-24 mb-4">
              <Image
                src={profileImage}
                alt={user.name}
                fill
                className="rounded-full object-cover border-2 border-gray-200"
              />
            </div>

            {/* 이름 및 직분 */}
            <div className="text-center mb-4">
              <p className="text-lg font-semibold text-gray-900">
                {user.name}
                <span className="text-sm text-gray-500 ml-2">
                  ({positionName})
                </span>
              </p>
              {/* 그룹 이름 */}
              <p className="text-sm text-gray-500">{groupName}</p>
            </div>

            {/* QR 코드 */}
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="My QR Code"
                className="w-48 h-48 mb-4"
              />
            ) : (
              <p className="text-center text-gray-500 mb-4">
                {t("generatingQR")}
              </p>
            )}

            {churchName}

            {/* 스캔 메시지 */}
            {scanMessage && (
              <div className="mt-2 p-3 bg-gray-100 rounded-lg text-center w-full">
                <p className="text-sm text-gray-700">{scanMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
