import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: 'blue' | 'green' | 'orange' | 'red' | 'slate';
  subtitle?: string;
  trend?: { value: number; label: string };
}

const colorMap = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-100', icon: 'bg-blue-500', text: 'text-blue-600' },
  green: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    icon: 'bg-emerald-500',
    text: 'text-emerald-600',
  },
  orange: {
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    icon: 'bg-amber-500',
    text: 'text-amber-600',
  },
  red: { bg: 'bg-red-50', border: 'border-red-100', icon: 'bg-red-500', text: 'text-red-600' },
  slate: {
    bg: 'bg-slate-50',
    border: 'border-slate-100',
    icon: 'bg-slate-500',
    text: 'text-slate-600',
  },
};

export default function StatCard({ title, value, icon, color, subtitle, trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl p-5 flex items-start gap-4`}>
      <div className={`${c.icon} text-white p-3 rounded-xl shrink-0`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <p className="text-slate-800 text-2xl font-bold mt-0.5">{value}</p>
        {subtitle && <p className="text-slate-400 text-xs mt-1">{subtitle}</p>}
        {trend && (
          <p
            className={`text-xs mt-1 font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
          >
            {trend.value >= 0 ? '+' : ''}
            {trend.value}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
