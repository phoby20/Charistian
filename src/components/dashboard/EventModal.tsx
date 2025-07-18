// src/components/EventModal.tsx
"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";

export default function EventModal() {
  const t = useTranslations("EventModal");
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // 페이지 로드 시 localStorage 확인
  useEffect(() => {
    console.debug("EventModal: useEffect triggered");
    try {
      const dontShow = localStorage.getItem("dontShowEventModal");
      console.debug("EventModal: dontShowEventModal =", dontShow);
      if (!dontShow) {
        console.debug("EventModal: Setting isOpen to true");
        setIsOpen(true);
      } else {
        console.debug("EventModal: dontShowEventModal is true, skipping modal");
      }
    } catch (error) {
      console.error("EventModal: localStorage error =", error);
    }
  }, []);

  // 모달 닫기 및 localStorage 업데이트
  const handleClose = () => {
    console.debug(
      "EventModal: handleClose called, dontShowAgain =",
      dontShowAgain
    );
    if (dontShowAgain) {
      try {
        localStorage.setItem("dontShowEventModal", "true");
        console.debug("EventModal: Set dontShowEventModal to true");
      } catch (error) {
        console.error("EventModal: Failed to set localStorage =", error);
      }
    }
    setIsOpen(false);
  };

  // 체크박스 상태 변경
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.debug("EventModal: Checkbox changed, value =", e.target.checked);
    setDontShowAgain(e.target.checked);
  };

  console.debug("EventModal: Rendering, isOpen =", isOpen);
  if (!isOpen) {
    console.debug("EventModal: isOpen is false, returning null");
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-gradient-to-b from-black/60 to-black/40 flex items-center justify-center z-[1000] backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl overflow-hidden"
        >
          {/* 이미지 배너 */}
          <div className="w-full mt-4 mb-4">
            <Image
              src="/images/score_upload_illustration.png" // 정적 이미지 경로
              alt="score_upload_illustration"
              height={400}
              width={600}
              className="object-cover rounded-2xl"
              priority
            />
          </div>

          {/* 닫기 버튼 */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </motion.button>

          {/* 설명 */}
          <p className="text-gray-600 mb-6 leading-relaxed whitespace-pre-wrap">
            {t("description")}
          </p>

          {/* 체크박스 */}
          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
            />
            <label
              htmlFor="dontShowAgain"
              className="ml-2 text-sm text-gray-600 cursor-pointer"
            >
              {t("dontShowAgain")}
            </label>
          </div>

          {/* 버튼들 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClose}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
            >
              {t("close")}
            </motion.button>
            <motion.a
              href="mailto:charistian.co@gmail.com"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-center shadow-md"
            >
              {t("contactUs")}
            </motion.a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
