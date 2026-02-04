import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "small" | "medium" | "large";
  icon?: React.ElementType;
  fullWidth?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  size = "medium",
  disabled = false,
  type = "button",
  className = "",
  icon: Icon,
  fullWidth = false,
  loading = false,
  ...props
}) => {
  const baseClass = "btn-modern";
  const variantClass = `${baseClass}-${variant}`;
  const sizeClass = `${baseClass}-${size}`;
  const widthClass = fullWidth ? "btn-full-width" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner"></span>
      ) : (
        <>
          {Icon && <Icon size={size === "large" ? 20 : 18} />}
          {children && <span>{children}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
