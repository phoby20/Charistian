import { FC, ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const Modal: FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-md max-w-md w-full">
        {children}
        <button
          onClick={onClose}
          className="mt-4 bg-gray-200 px-4 py-2 rounded-md"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default Modal;
