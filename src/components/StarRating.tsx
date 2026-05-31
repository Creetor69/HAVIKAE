
import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, size = 12, className = "" }) => {
  const percentage = (rating / 5) * 100;

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size * 5, height: size }}>
      {/* Background stars (gray/empty) */}
      <div 
        className="absolute inset-0 opacity-20 grayscale"
        style={{
          backgroundImage: `url('https://someuoatqyrqbkbiqggi.supabase.co/storage/v1/object/public/media/stars_provided.png')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat'
        }}
      />
      {/* Foreground stars (green/filled) */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url('https://someuoatqyrqbkbiqggi.supabase.co/storage/v1/object/public/media/stars_provided.png')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          width: `${percentage}%`,
          overflow: 'hidden'
        }}
      />
    </div>
  );
};

export default StarRating;
