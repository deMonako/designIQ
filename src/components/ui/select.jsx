// src/components/ui/select.jsx
import React, { useState, cloneElement, useEffect, useRef } from "react";
import ReactDOM from "react-dom";

export function Select({ value, onValueChange, children, className }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  const toggleOpen = () => setOpen((s) => !s);
  const close = () => setOpen(false);

  return (
    <div className={`relative ${className}`} ref={triggerRef}>
      {React.Children.map(children, (child) => {
        if (!child) return null;

        if (child.type?.displayName === "SelectTrigger") {
          return cloneElement(child, { open, toggleOpen, value });
        }
        if (child.type?.displayName === "SelectContent") {
          return cloneElement(child, { open, close, value, onValueChange, triggerRef });
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
  return <span className={className}>{children || placeholder}</span>;
}
SelectValue.displayName = "SelectValue";

/* ---------------------------
   Content + Item (lista)
   --------------------------- */
export function SelectContent({ children, open, close, onValueChange, value, triggerRef, className }) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (open && triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (!triggerRef?.current?.contains(e.target)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, close, triggerRef]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className={`absolute z-[9999] mt-1 bg-white border border-slate-200 rounded-lg shadow-lg ${className}`}
      style={{ top: pos.top, left: pos.left, width: pos.width }}
    >
      {React.Children.map(children, (child) => {
        if (!child) return null;
        return cloneElement(child, { onValueChange, close, selectedValue: value });
      })}
    </div>,
    document.body
  );
}
SelectContent.displayName = "SelectContent";

export function SelectItem({ children, value: itemValue, onValueChange, close, selectedValue, className }) {
  const handleClick = () => {
    onValueChange?.(itemValue);
    close?.();
  };

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
