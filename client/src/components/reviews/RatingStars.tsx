import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxStars = 5,
  size = 'sm',
}) => {
  const sizeClass = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => {
        const starNum = i + 1;
        const isFilled = starNum <= rating;

        return (
          <Star
            key={i}
            className={`${sizeClass} ${
              isFilled
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-200 dark:text-slate-700'
            }`}
          />
        );
      })}
    </div>
  );
};
