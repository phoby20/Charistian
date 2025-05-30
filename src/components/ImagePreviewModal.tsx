// src/components/ImagePreviewModal.tsx
import { useTranslation } from "next-i18next";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Image from "next/image";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  alt: string;
}

export default function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  alt,
}: ImagePreviewModalProps) {
  const { t } = useTranslation("common");

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {imageUrl && (
        <div className="flex justify-center">
          <Image
            src={imageUrl}
            alt={alt}
            width={600}
            height={400}
            className="rounded-md object-contain"
          />
        </div>
      )}
      <div className="flex justify-end mt-4">
        <Button
          onClick={onClose}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
        >
          {t("close")!}
        </Button>
      </div>
    </Modal>
  );
}
