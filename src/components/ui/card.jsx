import React from "react";

// Dodajemy ...props, aby przechwycić onClick i inne parametry
export function Card({ children, className, ...props }) {
  return (
    <div 
      {...props} 
      className={`rounded-2xl shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div 
      {...props} 
      className={`${className}`}
    >
      {children}
    </div>
  );
}