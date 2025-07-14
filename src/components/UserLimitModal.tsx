// src/components/UserLimitModal.tsx
import { useTranslations } from "next-intl";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { motion } from "framer-motion";

interface UserLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function UserLimitModal({
  isOpen,
  onClose,
  onUpgrade,
}: UserLimitModalProps) {
  const t = useTranslations();

  return (
    <Modal isOpen={isOpen}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-gray-100"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">
          {t("userLimitExceededTitle") || "성도 등록 한도 초과"}
        </h2>
        <p className="text-gray-600 text-base mb-6 leading-relaxed">
          {t("userLimitExceededMessage") ||
            "현재 플랜의 최대 사용자 등록 한도를 초과했습니다. 더 많은 사용자를 추가하려면 플랜을 업그레이드하세요."}
        </p>
        <div className="flex justify-end space-x-4">
          <Button
            onClick={onUpgrade}
            className="cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-full font-medium transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {t("upgradePlan") || "플랜 업그레이드"}
          </Button>
          <Button
            onClick={onClose}
            className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2.5 rounded-full font-medium transition-all duration-200"
          >
            {t("close") || "닫기"}
          </Button>
        </div>
      </motion.div>
    </Modal>
  );
}
