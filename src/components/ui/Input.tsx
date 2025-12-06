import React, { useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = "", id, ...props }) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full rounded-lg border bg-white dark:bg-slate-800 px-3 py-2 text-sm 
          text-slate-900 dark:text-white placeholder:text-slate-400 
          transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          disabled:cursor-not-allowed disabled:opacity-50
          ${error ? "border-red-500 focus:ring-red-500" : "border-slate-300 dark:border-slate-600"}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};
