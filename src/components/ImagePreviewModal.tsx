// src/components/ImagePreviewModal.tsx
"use client";
import Modal from "@/components/Modal";
import Image from "next/image";

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
          <Image
            src={imageUrl}
            alt={alt}
            width={600}
            height={400}
            className="rounded-md object-contain"
          />
        </div>
      )}
      <div className="flex justify-end mt-4"></div>
    </Modal>
  );
}
