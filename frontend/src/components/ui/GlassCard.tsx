import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  title,
  subtitle,
  headerAction,
  className,
  padding = true,
  hover = false,
  children,
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'glass-card overflow-hidden transition-all duration-200',
          hover && 'glass-card-hover',
          padding && 'p-6',
          className
        )
      )}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
