
import React, { useState } from 'react';
import { User, StoreSettings } from '../types';
import { motion } from 'framer-motion';

interface InfluencerDashboardProps {
  user: User;
  createInfluencerCoupon: (code: string) => Promise<boolean>;
  requestWithdrawal: (amount: number, paymentDetails: Record<string, any>) => Promise<boolean>;
  storeSettings: StoreSettings | null;
}

const InfluencerDashboard: React.FC<InfluencerDashboardProps> = ({ user, createInfluencerCoupon, requestWithdrawal, storeSettings }) => {
  const [couponCode, setCouponCode] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState(0);
  const [upiId, setUpiId] = useState('');

  const handleCreateCoupon = async () => {
    if (!couponCode.trim()) return;
    await createInfluencerCoupon(couponCode.toUpperCase());
    setCouponCode('');
  };

  const handleWithdrawal = async () => {
    if (withdrawalAmount <= 0 || !upiId) return;
    await requestWithdrawal(withdrawalAmount, { upi_id: upiId });
    setWithdrawalAmount(0);
  };

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'Total Earnings', value: `₹${(user as any).influencer_earnings || 0}`, color: 'bg-hav-forest text-hav-gold' },
          { label: 'Pending Payout', value: `₹${(user as any).pending_payout || 0}`, color: 'bg-white text-hav-forest' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`${stat.color} p-8 rounded-[2.5rem] shadow-xl border border-hav-gold/10`}
          >
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{stat.label}</p>
            <p className="text-4xl font-serif font-black mt-2">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coupon Management */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-hav-gold/10">
          <h3 className="text-2xl font-serif font-black text-hav-forest mb-6">Your Magic Code</h3>
          <p className="text-sm text-hav-olive/70 mb-8 leading-relaxed">
            Create a unique coupon code for your followers. They get a discount, and you earn a commission on every sale.
          </p>
          
          <div className="flex gap-4">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="e.g. SAVORY10"
              className="flex-grow bg-hav-cream border-2 border-transparent focus:border-hav-gold rounded-2xl px-6 py-4 outline-none font-black text-hav-forest placeholder:text-hav-olive/30 transition-all"
            />
            <button
              onClick={handleCreateCoupon}
              className="bg-hav-forest text-hav-gold font-black px-8 rounded-2xl hover:brightness-110 transition-all uppercase tracking-widest text-xs"
            >
              Generate
            </button>
          </div>
        </div>

        {/* Withdrawal Section */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-hav-gold/10">
          <h3 className="text-2xl font-serif font-black text-hav-forest mb-6">Cash Out</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-hav-gold mb-2 block">Amount to Withdraw</label>
              <input
                type="number"
                value={withdrawalAmount || ''}
                onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
                placeholder="₹ 0.00"
                className="w-full bg-hav-cream border-2 border-transparent focus:border-hav-gold rounded-2xl px-6 py-4 outline-none font-black text-hav-forest"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-hav-gold mb-2 block">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="username@bank"
                className="w-full bg-hav-cream border-2 border-transparent focus:border-hav-gold rounded-2xl px-6 py-4 outline-none font-black text-hav-forest"
              />
            </div>
            <button
              onClick={handleWithdrawal}
              className="w-full bg-hav-gold text-hav-forest font-black py-5 rounded-2xl hover:brightness-110 transition-all uppercase tracking-widest text-sm mt-4 shadow-lg shadow-hav-gold/20"
            >
              Request Payout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfluencerDashboard;
