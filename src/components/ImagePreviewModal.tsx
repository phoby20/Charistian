// src/components/ImagePreviewModal.tsx
"use client";
import Modal from "@/components/Modal";

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  alt: string;
}

export default function ImagePreviewModal({
  isOpen,
  imageUrl,
  alt,
}: ImagePreviewModalProps) {
  return (
    <Modal isOpen={isOpen}>
      {imageUrl && (
        <div className="flex justify-center">
          <img src={imageUrl} alt={alt} className="rounded-md object-contain" />
        </div>
      )}
      <div className="flex justify-end mt-4"></div>
    </Modal>
  );
}
