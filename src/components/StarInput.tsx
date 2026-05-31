
import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarInputProps {
  rating: number;
  onChange: (rating: number) => void;
  size?: number;
}

const StarInput: React.FC<StarInputProps> = ({ rating, onChange, size = 24 }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-125 focus:outline-none"
        >
          <Star
            size={size}
            fill={star <= (hover || rating) ? "#C9A236" : "none"}
            className={`${
              star <= (hover || rating)
                ? 'text-hav-gold'
                : 'text-hav-gold/30'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
};

export default StarInput;
