import React from "react";

export function Button({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`
        px-2 py-2   /* <- zmniejszony padding-y domyślny */
        rounded-xl
        text-white
        bg-gradient-to-r from-orange-600 to-orange-500
        hover:shadow-2xl hover:shadow-orange-500/50
        transition-all duration-300
        flex items-center justify-center
        ${className}
      `}
    >
      {children}
    </button>
  );
}
