import React from "react";

const Card = ({
  children,
  variant = "glass",
  hoverable = true,
  className = "",
  onClick,
}) => {
  const baseClass = "card-modern";
  const variantClass = `${baseClass}-${variant}`;
  const hoverClass = hoverable ? "is-hoverable" : "";

  return (
    <div
      className={`${baseClass} ${variantClass} ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
