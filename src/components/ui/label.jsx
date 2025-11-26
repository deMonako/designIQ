// src/components/ui/label.jsx
import React from "react";

export function Label({ children, htmlFor, className = "" }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-slate-700 ${className}`}
    >
      {children}
    </label>
  );
}
