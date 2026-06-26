import React from 'react';
import { cn } from './Button';

export const Input = React.forwardRef(({ className, type, error, label, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">{label}</label>}
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:ring-primary-400 transition-all",
          error && "border-rose-500 focus:ring-rose-500 dark:border-rose-500",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-rose-500 font-medium">{error}</p>}
    </div>
  );
});

Input.displayName = "Input";
