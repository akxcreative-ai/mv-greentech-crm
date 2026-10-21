import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'teal';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  status?: string;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  size = 'md',
  className,
  dot = false,
}) => {
  // Determine variant from status if variant is not explicitly provided
  let computedVariant: BadgeVariant = variant || 'default';

  if (!variant && status) {
    const s = status.toUpperCase();
    if (['WON', 'COMPLETED', 'CONFIRMED', 'DELIVERED', 'APPROVED', 'ACTIVE'].includes(s)) {
      computedVariant = 'success';
    } else if (['LOST', 'CANCELLED', 'OVERDUE', 'DISCONTINUED', 'EXPIRED'].includes(s)) {
      computedVariant = 'danger';
    } else if (['QUOTE_SUBMITTED', 'IN_PRODUCTION', 'PENDING', 'NEGOTIATION'].includes(s)) {
      computedVariant = 'warning';
    } else if (['GENERAL', 'DRAFT', 'SUPERSEDED'].includes(s)) {
      computedVariant = 'info';
    } else if (['MARKET', 'SENT', 'SHIPPED', 'CONVERTED'].includes(s)) {
      computedVariant = 'primary';
    } else if (['DIRECTOR', 'ADMINISTRATOR'].includes(s)) {
      computedVariant = 'purple';
    } else if (['SALES_HEAD', 'SALESPERSON'].includes(s)) {
      computedVariant = 'teal';
    }
  }

  const variantStyles: Record<BadgeVariant, { bg: string; dot: string }> = {
    default: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-500',
    },
    primary: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      dot: 'bg-emerald-600',
    },
    success: {
      bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      dot: 'bg-emerald-700',
    },
    warning: {
      bg: 'bg-amber-50 text-amber-800 border-amber-300',
      dot: 'bg-amber-500',
    },
    danger: {
      bg: 'bg-rose-50 text-rose-800 border-rose-300',
      dot: 'bg-rose-500',
    },
    info: {
      bg: 'bg-teal-50 text-teal-800 border-teal-300',
      dot: 'bg-teal-600',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-800 border-purple-300',
      dot: 'bg-purple-600',
    },
    teal: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      dot: 'bg-emerald-600',
    },
  };

  const currentStyle = variantStyles[computedVariant];

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  const displayText = children || (status ? status.replace(/_/g, ' ') : '');

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full border backdrop-blur-sm uppercase transition-all',
          currentStyle.bg,
          sizeStyles[size],
          className
        )
      )}
    >
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0 animate-pulse', currentStyle.dot)} />
      )}
      <span>{displayText}</span>
    </span>
  );
};
