import React from 'react';
import { getStatusColor } from '../../lib/formatters.js';

interface BadgeProps {
  status: string;
  customLabel?: string;
  showDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  customLabel,
  showDot = true,
  className = '',
}) => {
  const meta = getStatusColor(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.bg} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />}
      {customLabel || meta.label}
    </span>
  );
};
