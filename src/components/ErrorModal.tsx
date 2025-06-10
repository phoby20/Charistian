"use client";

import { useTranslations } from "next-intl";
import Button from "@/components/Button";
import Modal from "@/components/Modal";

interface ErrorModalProps {
  authError: string | null;
  fetchError: string | null;
  onClose: () => void;
}

export default function ErrorModal({
  authError,
  fetchError,
  onClose,
}: ErrorModalProps) {
  const t = useTranslations();
  const error = authError || fetchError;

  if (!error) return null;

  return (
    <Modal isOpen={!!error}>
      <div className="p-4">
        <p className="text-red-600 text-center mb-4">{error}</p>
        <div className="flex justify-end">
          <Button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
          >
            {t("close")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
