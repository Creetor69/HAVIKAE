
import React from 'react';

interface DiscountDisplayProps {
  originalPrice?: number;
  salePrice?: number;
  mrp?: number; // Added for compatibility
  price?: number; // Added for compatibility
  className?: string;
  size?: 'small' | 'large';
}

const DiscountDisplay: React.FC<DiscountDisplayProps> = ({ 
    originalPrice, 
    salePrice, 
    mrp, 
    price, 
    className = "",
    size = 'small'
}) => {
  const finalOriginalPrice = originalPrice || mrp || 0;
  const finalSalePrice = salePrice || price || 0;

  const discountAmount = finalOriginalPrice - finalSalePrice;
  const discountPercentage = finalOriginalPrice > 0 ? Math.round((discountAmount / finalOriginalPrice) * 100) : 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {discountPercentage > 0 && (
        <span className={`${size === 'large' ? 'text-base px-3 py-1' : 'text-[10px] px-2 py-0.5'} font-black text-red-600 bg-red-50 rounded-full border border-red-100 uppercase tracking-tighter`}>
          -{discountPercentage}%
        </span>
      )}
      <div className="flex flex-col items-end">
        <span className={`${size === 'large' ? 'text-2xl' : 'text-sm'} font-black`}>
          ₹{(finalSalePrice || 0).toFixed(2)}
        </span>
        {discountAmount > 0 && (
          <span className={`${size === 'large' ? 'text-sm' : 'text-[10px]'} font-medium text-hav-olive/40 line-through`}>
            ₹{(finalOriginalPrice || 0).toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
};

export default DiscountDisplay;
