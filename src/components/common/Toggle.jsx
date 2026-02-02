import React from "react";

const Toggle = ({ enabled, onToggle, label, className = "" }) => {
  return (
    <div className={`toggle-field ${className}`}>
      {label && <span>{label}</span>}
      <div
        className={`toggle-switch ${enabled ? "on" : "off"}`}
        onClick={() => onToggle(!enabled)}
      >
        <div className="toggle-switch-knob"></div>
      </div>
    </div>
  );
};

export default Toggle;
