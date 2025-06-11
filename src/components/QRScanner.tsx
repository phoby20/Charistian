// src/components/QRScanner.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import jsQR from "jsqr";
import { User } from "@prisma/client";

interface QRScannerProps {
  user: User;
  onMessage: (message: string) => void;
}

export default function QRScanner({ user, onMessage }: QRScannerProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isScanningRef = useRef<boolean>(true);
  const animationFrameRef = useRef<number | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, // 전면 카메라
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.error("Video play error:", err);
        });
        scanQRCode();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setMessage(t("cameraError"));
      onMessage(t("cameraError"));
      setTimeout(() => {
        setMessage(null);
        onMessage("");
      }, 3000);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanningRef.current)
      return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      console.error("Canvas context not available");
      return;
    }

    const scan = async () => {
      if (
        video.readyState === video.HAVE_ENOUGH_DATA &&
        isScanningRef.current
      ) {
        try {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            isScanningRef.current = false;
            setIsLoading(true);

            try {
              // JSON 파싱 전 데이터 검증
              if (!code.data || code.data.trim() === "") {
                throw new Error("Empty QR code data");
              }

              let qrData;
              try {
                qrData = JSON.parse(code.data);
              } catch (parseErr) {
                console.error("QR code JSON parse error:", parseErr);
                throw new Error("Invalid QR code format");
              }

              const { userId, churchId } = qrData;
              if (!userId || !churchId) {
                throw new Error("Missing userId or churchId in QR code");
              }

              // churchId 확인
              if (churchId !== user.churchId) {
                const churchResponse = await fetch(
                  `/api/churches/${churchId}`,
                  {
                    credentials: "include",
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                  }
                );
                if (!churchResponse.ok) {
                  throw new Error("Failed to fetch church");
                }
                const churchData = await churchResponse.json();
                const errorMsg = `${churchData.name} 소속이 아닙니다.`;
                setMessage(errorMsg);
                onMessage(errorMsg);
                setTimeout(() => {
                  setMessage(null);
                  onMessage("");
                  isScanningRef.current = true;
                  setIsLoading(false);
                  if (videoRef.current && streamRef.current) {
                    videoRef.current.play().catch((err) => {
                      console.error("Video replay error:", err);
                    });
                  }
                  scanQRCode();
                }, 3000);
                return;
              }

              // 출석 체크 API 호출
              const response = await fetch("/api/attendance", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                credentials: "include",
                body: JSON.stringify({ userId }),
              });

              const data = await response.json();
              if (response.ok) {
                const userResponse = await fetch(`/api/users/${userId}`, {
                  credentials: "include",
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                });
                if (!userResponse.ok) {
                  throw new Error("Failed to fetch user");
                }
                const userData = await userResponse.json();
                const successMsg = `${userData.name}님 환영합니다.`;
                setMessage(successMsg);
                onMessage(successMsg);
              } else {
                const errorMsg =
                  data.error === "Attendance already recorded"
                    ? "이미 출석하셨습니다."
                    : t("serverError");
                setMessage(errorMsg);
                onMessage(errorMsg);
              }
              setTimeout(() => {
                setMessage(null);
                onMessage("");
                isScanningRef.current = true;
                setIsLoading(false);
                if (videoRef.current && streamRef.current) {
                  videoRef.current.play().catch((err) => {
                    console.error("Video replay error:", err);
                  });
                }
                scanQRCode();
              }, 3000);
            } catch (err) {
              console.error("Error processing QR code:", err);
              const errorMsg =
                err instanceof Error ? err.message : t("serverError");
              setMessage(errorMsg);
              onMessage(errorMsg);
              setTimeout(() => {
                setMessage(null);
                onMessage("");
                isScanningRef.current = true;
                setIsLoading(false);
                if (videoRef.current && streamRef.current) {
                  videoRef.current.play().catch((err) => {
                    console.error("Video replay error:", err);
                  });
                }
                scanQRCode();
              }, 3000);
            }
            return;
          }
        } catch (err) {
          console.error("Error during scan:", err);
        }
      }
      animationFrameRef.current = requestAnimationFrame(scan);
    };

    animationFrameRef.current = requestAnimationFrame(scan);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (
    !["CHECKER", "SUPER_ADMIN", "ADMIN", "SUB_ADMIN"].includes(user.role) ||
    !user.churchId
  ) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
      >
        {t("scanQR")}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full relative">
            <h2 className="text-xl font-bold mb-4">{t("scanQR")}</h2>
            <div className="relative w-full">
              <video
                ref={videoRef}
                className="w-full h-full bg-black"
                autoPlay
                playsInline
              />
              {isLoading && (
                <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            {message && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <p className="text-lg text-white font-semibold bg-gray-800 bg-opacity-70 px-4 py-2 rounded-lg text-center max-w-[80%]">
                  {message}
                </p>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setIsOpen(false);
                  stopCamera();
                }}
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
