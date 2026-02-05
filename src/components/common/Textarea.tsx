import React from "react";
import { cn } from "../../utils/cn";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  className = "",
  rows = 4,
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
          "flex bg-white/5 border border-white/10 rounded-xl transition-all duration-200 focus-within:border-deckly-primary/50 focus-within:bg-white/10 group",
          error ? "border-deckly-accent/50 bg-deckly-accent/5" : "",
        )}
      >
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className="bg-transparent border-none outline-none w-full text-white placeholder-slate-600 p-4 resize-none"
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs text-deckly-accent px-1 font-medium animate-in fade-in slide-in-from-top-1">
          {error}
        </span>
      )}
    </div>
  );
};

export default Textarea;
