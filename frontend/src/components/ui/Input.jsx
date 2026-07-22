import { forwardRef } from 'react';
import { cn } from '../../utils/helpers.js';

const Input = forwardRef(({
  label, error, hint, leftIcon, rightIcon, className, ...props
}, ref) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <div className="relative">
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {leftIcon}
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          'input',
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          error && 'border-red-400 focus:ring-red-400 dark:border-red-500',
          className
        )}
        {...props}
      />
      {rightIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {rightIcon}
        </div>
      )}
    </div>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    {hint && !error && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
  </div>
));
Input.displayName = 'Input';
export default Input;
