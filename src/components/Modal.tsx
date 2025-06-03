// src/components/Modal.tsx
import { FC, ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  children: ReactNode;
}

const Modal: FC<ModalProps> = ({ isOpen, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-md max-w-2xl w-full">{children}</div>
    </div>
  );
};

export default Modal;
