import React from "react";
import { cn } from "../../utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ElementType;
  rightElement?: React.ReactNode;
  error?: string | null;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
  rightElement,
  error,
  className = "",
  onClick,
  readOnly = false,
  ...props
}) => {
  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      {label && (
        <label className="text-sm font-medium text-slate-400 px-1">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl transition-all duration-200 focus-within:border-deckly-primary/50 focus-within:bg-white/10 group",
          error ? "border-deckly-accent/50 bg-deckly-accent/5" : "",
          onClick ? "cursor-pointer" : "",
        )}
        onClick={onClick}
      >
        {Icon && (
          <Icon
            size={18}
            className={cn(
              "text-slate-500 group-focus-within:text-deckly-primary transition-colors",
              error ? "text-deckly-accent" : "",
            )}
          />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className="bg-transparent border-none outline-none w-full text-white placeholder-slate-600"
          {...props}
        />
        {rightElement && (
          <div className="flex items-center justify-center shrink-0">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <span className="text-xs text-deckly-accent px-1 font-medium animate-in fade-in slide-in-from-top-1">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
