import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

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
  const variants = {
    glass: "bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl",
    solid: "bg-deckly-background border border-white/5 shadow-xl",
    outline: "bg-transparent border-2 border-white/10",
  };

  return (
    <motion.div
      whileHover={hoverable ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={cn(
        "rounded-2xl overflow-hidden p-4",
        variants[variant],
        hoverable ? "cursor-pointer" : "",
        className,
      )}
      onClick={onClick}
      style={style}
    >
      {children}
    </motion.div>
  );
};

export default Card;
