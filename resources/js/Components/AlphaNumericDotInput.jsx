// resources/js/Components/AlphaNumericDotInput.jsx
import React from 'react';

export default function AlphaNumericDotInput({ value, onChange, ...props }) {
  const handleChange = (e) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9.]/g, '');
    onChange(cleaned);
  };

  return (
    <input
      {...props}
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={(e) => {
        if (!/[a-zA-Z0-9.]|Backspace|Delete|ArrowLeft|ArrowRight|Tab/.test(e.key)) {
          e.preventDefault();
        }
      }}
      className="border rounded p-2 w-full"
    />
  );
}
