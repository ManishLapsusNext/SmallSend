import React from "react";

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
    <div className={`form-field-wrapper ${className}`}>
      {label && <label className="form-field-label">{label}</label>}
      <div className={`form-field-inner-textarea ${error ? "has-error" : ""}`}>
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          {...props}
        />
      </div>
      {error && <span className="field-error-text">{error}</span>}
    </div>
  );
};

export default Textarea;
