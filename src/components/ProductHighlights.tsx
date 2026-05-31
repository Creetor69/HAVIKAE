
import React from 'react';
import { ShieldCheck, Leaf, Zap, Award } from 'lucide-react';

interface Highlight {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const highlights: Highlight[] = [
  {
    icon: <ShieldCheck className="text-hav-gold" />,
    title: "100% Pure",
    description: "No preservatives or colors"
  },
  {
    icon: <Leaf className="text-hav-gold" />,
    title: "Heritage",
    description: "Traditional recipes"
  },
  {
    icon: <Zap className="text-hav-gold" />,
    title: "Freshly Made",
    description: "Small batches for quality"
  },
  {
    icon: <Award className="text-hav-gold" />,
    title: "Certified",
    description: "FSSAI & ISO standards"
  }
];

const ProductHighlights: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 py-4 border-y border-hav-gold/10">
      {highlights.map((item, i) => (
        <div key={i} className="flex flex-col items-center text-center p-2 rounded-xl hover:bg-hav-cream/50 transition-colors group">
          <div className="mb-2 p-2 bg-hav-cream rounded-full group-hover:scale-110 transition-transform">
            {React.cloneElement(item.icon as React.ReactElement, { size: 16 })}
          </div>
          <h4 className="text-[10px] font-black text-hav-forest uppercase tracking-widest mb-0.5">{item.title}</h4>
          <p className="text-[8px] text-hav-olive/60 font-medium leading-tight">{item.description}</p>
        </div>
      ))}
    </div>
  );
};

export default ProductHighlights;
