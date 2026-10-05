import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border ${
          error
            ? 'border-rose-500 focus:ring-rose-500'
            : 'border-slate-300 dark:border-slate-700 focus:ring-orange-500'
        } rounded-xl px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 cursor-pointer ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>}
      {!error && helperText && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{helperText}</p>
      )}
    </div>
  );
};
