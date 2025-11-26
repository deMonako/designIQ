import React, { useState } from "react";

export function Checkbox({ checked, onCheckedChange, ...props }) {
  const isControlled = checked !== undefined;

  const [internalChecked, setInternalChecked] = useState(false);

  const value = isControlled ? checked : internalChecked;

  const handleChange = (e) => {
    const newValue = e.target.checked;

    if (!isControlled) {
      setInternalChecked(newValue);
    }

    onCheckedChange?.(newValue);
  };

  return (
    <input
      type="checkbox"
      className="w-5 h-5 accent-orange-600 cursor-pointer"
      checked={value}
      onChange={handleChange}
      {...props}
    />
  );
}
