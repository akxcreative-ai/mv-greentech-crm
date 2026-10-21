import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type StatColor = 'blue' | 'teal' | 'green' | 'purple' | 'orange' | 'red' | 'emerald';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number | string;
    isPositive?: boolean;
    label?: string;
  };
  color?: StatColor;
  className?: string;
  isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  color = 'blue',
  className,
  isLoading = false,
}) => {
  const borderColors: Record<StatColor, string> = {
    blue: 'border-l-blue-500',
    teal: 'border-l-teal-500',
    green: 'border-l-emerald-500',
    emerald: 'border-l-emerald-400',
    purple: 'border-l-purple-500',
    orange: 'border-l-amber-500',
    red: 'border-l-rose-500',
  };

  const iconBgColors: Record<StatColor, string> = {
    blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    teal: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    orange: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    red: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'glass-card p-5 border-l-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-950/5',
          borderColors[color],
          className
        )
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
            {label}
          </p>
          {isLoading ? (
            <div className="h-8 w-24 bg-slate-100 rounded animate-pulse mt-2"></div>
          ) : (
            <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight truncate">
              {value}
            </h3>
          )}
        </div>
        <div className={clsx('p-3 rounded-xl shrink-0', iconBgColors[color])}>
          {icon}
        </div>
      </div>

      {trend && !isLoading && (
        <div className="mt-3.5 flex items-center gap-1.5 text-xs">
          {trend.isPositive === true && (
            <span className="flex items-center text-emerald-600 font-semibold">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              {typeof trend.value === 'number' ? `+${trend.value}%` : trend.value}
            </span>
          )}
          {trend.isPositive === false && (
            <span className="flex items-center text-rose-600 font-semibold">
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
              {typeof trend.value === 'number' ? `-${trend.value}%` : trend.value}
            </span>
          )}
          {trend.isPositive === undefined && (
            <span className="flex items-center text-slate-500 font-medium">
              <Minus className="w-3.5 h-3.5 mr-0.5" />
              {trend.value}
            </span>
          )}
          {trend.label && <span className="text-slate-400">{trend.label}</span>}
        </div>
      )}
    </div>
  );
};
