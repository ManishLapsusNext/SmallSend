import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ElementType;
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
  error,
  className = "",
  onClick,
  readOnly = false,
  ...props
}) => {
  return (
    <div className={`form-field-wrapper ${className}`}>
      {label && <label className="form-field-label">{label}</label>}
      <div
        className={`form-field-inner ${error ? "has-error" : ""} ${Icon ? "has-icon" : ""}`}
        onClick={onClick}
      >
        {Icon && <Icon size={18} className="field-icon" />}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          {...props}
        />
      </div>
      {error && <span className="field-error-text">{error}</span>}
    </div>
  );
};

export default Input;
