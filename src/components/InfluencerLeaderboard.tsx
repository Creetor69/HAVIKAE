
import React from 'react';
import { motion } from 'framer-motion';

const InfluencerLeaderboard: React.FC = () => {
  const influencers: any[] = [];

  return (
    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-hav-gold/10">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-3xl font-serif font-black text-hav-forest">Elite Partners</h2>
          <p className="text-xs font-black uppercase tracking-widest text-hav-gold mt-2">Top performers this month</p>
        </div>
        <div className="text-right hidden md:block">
          <span className="text-4xl font-serif font-black text-hav-gold">#1</span>
          <p className="text-[10px] font-black uppercase tracking-widest text-hav-olive/60">Global Rank</p>
        </div>
      </div>

      <div className="space-y-4">
        {influencers.length > 0 ? influencers.map((inf, idx) => (
          <motion.div
            key={inf.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center gap-6 p-6 rounded-3xl hover:bg-hav-cream/50 transition-all group border border-transparent hover:border-hav-gold/20"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${
              idx === 0 ? 'bg-hav-gold text-hav-forest' : 'bg-hav-forest text-hav-gold'
            }`}>
              {inf.avatar}
            </div>
            
            <div className="flex-grow">
              <h3 className="font-black text-hav-forest group-hover:text-hav-orange transition-colors">{inf.name}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-hav-olive/60">{inf.sales} Successful Referrals</p>
            </div>

            <div className="text-right">
              <p className="text-xl font-serif font-black text-hav-forest">{inf.revenue}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-hav-gold">Earnings Generated</p>
            </div>
          </motion.div>
        )) : (
            <div className="text-center py-12">
                <p className="text-hav-olive/40 font-serif italic text-xl">Our partner circle is growing. Check back soon for the leaderboard!</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default InfluencerLeaderboard;
