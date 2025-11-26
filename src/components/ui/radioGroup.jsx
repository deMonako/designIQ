// src/components/ui/radioGroup.jsx
import React, { createContext, useContext } from "react";

// tworzymy kontekst dla grupy
const RadioGroupContext = createContext();

export function RadioGroup({ value, onValueChange, name, children, className }) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
      <div className={className}>{children}</div>
    </RadioGroupContext.Provider>
  );
}

export function Radio({ value, label, ...props }) {
  const ctx = useContext(RadioGroupContext);

  const isChecked = ctx?.value === value;

  const handleChange = () => {
    ctx?.onValueChange?.(value);
  };

  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="radio"
        name={ctx?.name}
        value={value}
        checked={isChecked}
        onChange={handleChange}
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
}

export function RadioGroupItem({ value, label }) {
  return <Radio value={value} label={label} />;
}
