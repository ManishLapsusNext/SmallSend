import React from "react";

interface CardProps {
  children: React.ReactNode;
  variant?: "glass" | "solid" | "outline";
  hoverable?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = "glass",
  hoverable = true,
  className = "",
  onClick,
  style,
}) => {
  const baseClass = "card-modern";
  const variantClass = `${baseClass}-${variant}`;
  const hoverClass = hoverable ? "is-hoverable" : "";

  return (
    <div
      className={`${baseClass} ${variantClass} ${hoverClass} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
};

export default Card;
