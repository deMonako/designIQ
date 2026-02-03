import React, { useState } from "react";

/* =========================
   Accordion
========================= */
export function Accordion({ children, className = "" }) {
  const [openValue, setOpenValue] = useState(null);

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          openValue,
          setOpenValue,
        })
      )}
    </div>
  );
}

/* =========================
   AccordionItem
========================= */
export function AccordionItem({
  value,
  children,
  openValue,
  setOpenValue,
  className = "",
}) {
  const isOpen = openValue === value;

  return (
    <div
      className={`
        border border-gray-200
        rounded-xl
        overflow-hidden
        ${className}
      `}
    >
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          isOpen,
          value,
          openValue,
          setOpenValue,
        })
      )}
    </div>
  );
}

/* =========================
   AccordionTrigger
========================= */
export function AccordionTrigger({
  children,
  value,
  openValue,
  setOpenValue,
  className = "",
}) {
  const isOpen = openValue === value;

  return (
    <button
      onClick={() =>
        setOpenValue(isOpen ? null : value)
      }
      className={`
        w-full
        px-4 py-3
        text-left font-medium
        bg-gray-50 hover:bg-gray-100
        flex items-center justify-between
        transition-all
        ${className}
      `}
    >
      {children}
      <span
        className={`transition-transform ${
          isOpen ? "rotate-180" : ""
        }`}
      >
        ▼
      </span>
    </button>
  );
}

/* =========================
   AccordionContent
========================= */
export function AccordionContent({
  children,
  isOpen,
  className = "",
}) {
  return (
    <div
      className={`
        px-4
        overflow-hidden
        transition-all duration-300
        ${isOpen ? "max-h-96 py-3" : "max-h-0"}
        ${className}
      `}
    >
      {isOpen && (
        <div className="text-sm text-gray-600">
          {children}
        </div>
      )}
    </div>
  );
}
