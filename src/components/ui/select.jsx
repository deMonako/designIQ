// src/components/ui/select.jsx
import React, { useState, cloneElement, useEffect, useRef } from "react";

export function Select({ value, onValueChange, children, className }) {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => setOpen((s) => !s);
  const close = () => setOpen(false);

  return (
    <div className={`relative ${className}`}>
      {React.Children.map(children, (child) => {
        if (!child) return null;

        if (child.type?.displayName === "SelectTrigger") {
          // przekazujemy open, toggleOpen, value
          return cloneElement(child, { open, toggleOpen, value });
        }
        if (child.type?.displayName === "SelectContent") {
          // przekazujemy open, close, value, onValueChange
          return cloneElement(child, { open, close, value, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

/* ---------------------------
   Trigger + Value (wyświetlanie)
   --------------------------- */
export function SelectTrigger({ open, toggleOpen, value, children, className }) {
  let displayClasses = "";
  let placeholder = "Wybierz...";

  React.Children.forEach(children, (child) => {
    if (child && child.type?.displayName === "SelectValue") {
      displayClasses = child.props.className || "";
      if (child.props.children) {
        placeholder = child.props.children;
      }
    }
  });

  const contentToDisplay = value || placeholder;
  const placeholderClass = !value ? "text-slate-500" : "";

  return (
    <button
      type="button"
      onClick={toggleOpen}
      className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${className}`}
    >
      <span className={`${displayClasses} ${placeholderClass}`}>{contentToDisplay}</span>
    </button>
  );
}
SelectTrigger.displayName = "SelectTrigger";

export function SelectValue({ children, placeholder, className }) {
  // jeśli są children -> użyj children
  // jeśli nie ma -> placeholder
  return <span className={className}>{children || placeholder}</span>;
}
SelectValue.displayName = "SelectValue";

/* ---------------------------
   Content + Item (lista)
   --------------------------- */
export function SelectContent({ children, open, close, onValueChange, value, className }) {
  if (!open) return null;

  return (
    <div className={`absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg ${className}`}>
      {React.Children.map(children, (child) => {
        if (!child) return null;
        // przekazujemy aktualną wartość jako `selectedValue`
        return cloneElement(child, { onValueChange, close, selectedValue: value });
      })}
    </div>
  );
}
SelectContent.displayName = "SelectContent";

export function SelectItem({ children, value: itemValue, onValueChange, close, selectedValue, className }) {
  const handleClick = () => {
    onValueChange?.(itemValue);
    close?.();
  };

  // selectedValue to aktualny value z Select; itemValue to wartość tego elementu
  const isSelected = selectedValue === itemValue;

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
