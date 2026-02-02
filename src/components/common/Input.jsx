import React from "react";

const Input = ({
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
