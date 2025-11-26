// src/components/ui/input.jsx
import React from "react";

export function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${className}`}
    />
  );
}
