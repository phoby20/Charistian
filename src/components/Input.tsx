// src/components/Input.tsx
import { FC, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input: FC<InputProps> = ({ label, disabled, ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-500 mb-1">
      {label}
    </label>
    <input
      className={`mt-1 p-2 border rounded-md w-full ${
        disabled ? "bg-gray-200 cursor-not-allowed" : ""
      }`}
      disabled={disabled}
      {...props}
    />
  </div>
);

export default Input;
