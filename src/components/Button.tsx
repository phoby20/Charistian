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
    "px-4 py-2 rounded-md font-medium transition-colors duration-200";
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-black hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-blue-600 text-blue-600 hover:bg-blue-50",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${
        isDisabled
          ? "cursor-not-allowed bg-gray-200 text-black hover:bg-gray-200"
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
