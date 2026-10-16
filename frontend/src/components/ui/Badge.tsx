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
      bg: 'bg-white/10 text-white/80 border-white/15',
      dot: 'bg-white/60',
    },
    primary: {
      bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      dot: 'bg-blue-400',
    },
    success: {
      bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    warning: {
      bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400',
    },
    danger: {
      bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-400',
    },
    info: {
      bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      dot: 'bg-sky-400',
    },
    purple: {
      bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      dot: 'bg-purple-400',
    },
    teal: {
      bg: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
      dot: 'bg-teal-400',
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
