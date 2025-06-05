import { FC, ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  children: ReactNode;
}

const Modal: FC<ModalProps> = ({ isOpen, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg w-full max-w-md mx-4 my-4 max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {children}
      </div>
    </div>
  );
};

export default Modal;
