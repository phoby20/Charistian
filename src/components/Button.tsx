import { FC, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline";
  isDisabled?: boolean;
  onClick?: () => void;
}

const Button: FC<ButtonProps> = ({
  children,
  variant = "primary",
  isDisabled = false,
  onClick,
  ...props
}) => {
  const baseStyles =
    "px-4 py-3 rounded-md font-medium transition-colors duration-200 w-full flex items-center justify-center space-x-2";
  const variantStyles = {
    primary: "bg-[#fc089e] text-white hover:bg-[#ff66c4]",
    secondary: "bg-gray-200 text-black hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline:
      "border border-[#fc089e] text-[#fc089e] hover:bg-[#fc089e] hover:text-white",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${
        isDisabled
          ? "cursor-not-allowed bg-gray-200 text-white hover:bg-gray-200 border-gray-100"
          : "cursor-pointer"
      }`}
      {...props}
      onClick={onClick}
      disabled={isDisabled}
    >
      {children}
    </button>
  );
};

export default Button;
