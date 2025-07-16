"use client";

import { FC } from "react";

interface LoadingProps {
  message?: string; // 로딩 메시지 (선택)
}

const Loading: FC<LoadingProps> = ({ message = "Loading..." }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900/70 to-black/70 pointer-events-none"
      aria-label="로딩 중"
      aria-busy="true" // 스크린 리더에 로딩 상태 전달
      role="status"
    >
      <div className="flex flex-col items-center gap-6 pointer-events-none">
        {/* 로딩 스피너 */}
        <div className="relative w-16 h-16">
          <div
            className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin pointer-events-none"
            style={{ animationDuration: "1.2s" }}
          ></div>
          <div
            className="absolute inset-0 border-4 border-transparent border-t-blue-300 border-r-purple-300 rounded-full animate-spin opacity-50 scale-90 pointer-events-none"
            style={{ animationDuration: "1.2s", animationDelay: "0.2s" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse opacity-20 pointer-events-none"></div>
        </div>
        {/* 로딩 메시지 */}
        {message && (
          <div
            className="px-6 py-3 bg-white/90 backdrop-blur-md rounded-xl shadow-lg text-gray-800 text-lg font-semibold animate-fade-in pointer-events-none"
            aria-live="polite"
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Loading;
