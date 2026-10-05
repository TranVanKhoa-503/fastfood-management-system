import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', text, className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center p-8 gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses} animate-spin text-orange-600 dark:text-orange-500`} />
      {text && <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{text}</p>}
    </div>
  );
};
