import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-white/80">
            {label}
            {props.required && <span className="text-rose-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 flex items-center z-10">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            style={{
              paddingLeft: leftIcon ? '2.75rem' : undefined,
              paddingRight: rightIcon ? '2.75rem' : undefined,
              ...props.style,
            }}
            className={twMerge(
              clsx(
                'glass-input placeholder:text-white/30',
                leftIcon && '!pl-11',
                rightIcon && '!pr-11',
                error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
                className
              )
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-white/50 z-10">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-rose-400 font-normal">{error}</p>}
        {!error && helperText && <p className="text-xs text-white/40">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
