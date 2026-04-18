import React from 'react';

interface CheckboxGroupProps {
  values: string[];
  setValues: (selectedValues: string[]) => void;
  className?: string;
}

const defaultOptions = [
  { value: "terms", label: "I accept the Terms and Conditions" },
  { value: "privacy", label: "I accept the Privacy Policy" },
  { value: "marketing", label: "I want to receive marketing communications (optional)" },
];

export default function CheckboxGroup({ values, setValues, className = '' }: CheckboxGroupProps) {
  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      setValues([...values, value]);
    } else {
      setValues(values.filter(v => v !== value));
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {defaultOptions.map((option) => (
        <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={values.includes(option.value)}
            onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
            className="neu-checkbox"
          />
          <span className="text-sm text-gray-700">{option.label}</span>
        </label>
      ))}
    </div>
  );
}