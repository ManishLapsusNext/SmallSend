import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

interface ToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  label?: string;
  className?: string;
}

const Toggle: React.FC<ToggleProps> = ({
  enabled,
  onToggle,
  label,
  className = "",
}) => {
  return (
    <div
      className={cn("flex items-center justify-between gap-4 py-3", className)}
    >
      {label && (
        <span className="text-sm font-medium text-slate-300">{label}</span>
      )}
      <button
        type="button"
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-deckly-primary/50 flex items-center px-1",
          enabled ? "bg-deckly-primary" : "bg-slate-700",
        )}
        onClick={() => onToggle(!enabled)}
      >
        <motion.div
          animate={{ x: enabled ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="w-4 h-4 bg-white rounded-full shadow-lg"
        />
      </button>
    </div>
  );
};

export default Toggle;
