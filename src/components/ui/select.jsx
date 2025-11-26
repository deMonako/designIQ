// src/components/ui/select.jsx
import React, { useState, cloneElement } from "react";

export function Select({ value, onValueChange, children, className }) {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => setOpen(!open);
  const close = () => setOpen(false);

  return (
    <div className={`relative ${className}`}>
      {React.Children.map(children, (child) => {
        if (!child) return null;

        if (child.type.displayName === "SelectTrigger") {
          return cloneElement(child, { open, toggleOpen, value });
        }
        if (child.type.displayName === "SelectContent") {
          return cloneElement(child, { open, close, value, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

export function SelectTrigger({ open, toggleOpen, value, className }) {
  return (
    <button
      type="button"
      onClick={toggleOpen}
      className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${className}`}
    >
      {value || "Wybierz..."}
    </button>
  );
}
SelectTrigger.displayName = "SelectTrigger";

export function SelectValue({ children }) {
  return <span>{children}</span>;
}

export function SelectContent({ children, open, close, onValueChange, value, className }) {
  if (!open) return null;

  return (
    <div className={`absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg ${className}`}>
      {React.Children.map(children, (child) => {
        if (!child) return null;
        return cloneElement(child, { onValueChange, value, close });
      })}
    </div>
  );
}
SelectContent.displayName = "SelectContent";

export function SelectItem({ children, value, onValueChange, close, className }) {
  const handleClick = () => {
    onValueChange?.(value);
    close?.();
  };

  const isSelected = value === children;

  return (
    <div
      onClick={handleClick}
      className={`px-3 py-2 cursor-pointer hover:bg-orange-50 ${isSelected ? "bg-orange-100 font-semibold" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
SelectItem.displayName = "SelectItem";
