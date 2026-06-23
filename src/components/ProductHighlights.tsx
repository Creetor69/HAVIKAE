
import React from 'react';
import { ShieldCheck, Leaf, Zap, Award, CheckCircle2, Star } from 'lucide-react';
import { Product } from '../types';

interface Highlight {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

const defaultHighlights: Highlight[] = [
  {
    icon: <ShieldCheck className="text-hav-gold" />,
    title: "100% Pure",
    description: "No preservatives"
  },
  {
    icon: <Leaf className="text-hav-gold" />,
    title: "Heritage",
    description: "Traditional recipe"
  },
  {
    icon: <Zap className="text-hav-gold" />,
    title: "Fresh",
    description: "Small batches"
  },
  {
    icon: <Award className="text-hav-gold" />,
    title: "Certified",
    description: "FSSAI & ISO standards"
  }
];

const ProductHighlights: React.FC<{ product?: Product }> = ({ product }) => {
  let customBenefits: Highlight[] = [];
  if (product?.benefits) {
      customBenefits = product.benefits.split('\n').filter(b => b.trim() !== '').map(benefitLine => {
          return {
              title: benefitLine.trim(),
          };
      });
  }

  // If we have custom benefits, let's display them in a list style to match the request
  if (customBenefits.length > 0) {
      return (
          <div className="bg-white border-2 border-hav-gold/10 p-4 rounded-xl shadow-sm mb-4">
              <h4 className="text-[10px] uppercase font-black text-hav-forest tracking-wider mb-3 flex items-center gap-2">
                  <Star className="text-hav-gold w-4 h-4 fill-current"/>
                  Why You'll Love This
              </h4>
              <ul className="space-y-2">
                  {customBenefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                          <span className="text-sm font-bold text-hav-forest">{benefit.title}</span>
                      </li>
                  ))}
              </ul>
          </div>
      );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 py-4 border-y border-hav-gold/10">
      {defaultHighlights.map((item, i) => (
        <div key={i} className="flex flex-col items-center text-center p-2 rounded-xl hover:bg-hav-cream/50 transition-colors group">
          <div className="mb-2 p-2 bg-hav-cream rounded-full group-hover:scale-110 transition-transform">
            {item.icon && React.cloneElement(item.icon as React.ReactElement, { size: 16 })}
          </div>
          <h4 className="text-[10px] font-black text-hav-forest uppercase tracking-widest mb-0.5">{item.title}</h4>
          {item.description && <p className="text-[8px] text-hav-olive/60 font-medium leading-tight">{item.description}</p>}
        </div>
      ))}
    </div>
  );
};

export default ProductHighlights;
