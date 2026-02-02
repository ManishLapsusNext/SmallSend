import React from "react";

const Button = ({
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
