import React, { useState } from 'react';
import { User, StoreSettings, Page, InfluencerApplicationInsert } from '../types';
import InfluencerLeaderboard from '../components/InfluencerLeaderboard';
import InfluencerDashboard from '../components/InfluencerDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';

interface InfluencerPageProps {
  user: User | null;
  createInfluencerCoupon: (code: string) => Promise<boolean>;
  requestWithdrawal: (amount: number, paymentDetails: Record<string, any>) => Promise<boolean>;
  storeSettings: StoreSettings | null;
  navigateTo: (page: Page) => void;
}

type InfluencerTab = 'leaderboard' | 'dashboard' | 'apply';

const InfluencerPage: React.FC<InfluencerPageProps> = ({ user, createInfluencerCoupon, requestWithdrawal, storeSettings, navigateTo }) => {
  const [activeTab, setActiveTab] = useState<InfluencerTab>(user?.is_influencer ? 'dashboard' : 'apply');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState<InfluencerApplicationInsert>({
    name: user?.name || '',
    email: user?.email || '',
    phone_number: user?.mobile || '',
    platform_link: '',
    follower_count: '',
    audience_type: '',
    reason_why: '',
    how_to_promote: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase!
        .from('influencer_applications')
        .insert([formData]);

      if (error) throw error;
      setIsSuccess(true);
    } catch (err: any) {
      alert(`Error submitting application: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyles = "mt-1 block w-full border border-hav-orange-200 rounded-md shadow-sm py-2 px-3 focus:ring-hav-forest focus:border-hav-forest bg-white text-hav-forest font-medium";

  const TabButton: React.FC<{ tab: InfluencerTab; label: string }> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-8 py-4 font-black transition-all text-sm uppercase tracking-[0.2em] relative overflow-hidden group ${
        activeTab === tab
          ? 'text-hav-forest'
          : 'text-hav-olive/40 hover:text-hav-forest'
      }`}
    >
      {label}
      {activeTab === tab && (
        <motion.div 
            layoutId="activeTab"
            className="absolute bottom-0 left-0 right-0 h-1 bg-hav-gold rounded-full"
        />
      )}
    </button>
  );

  return (
    <div className="bg-hav-cream min-h-screen pb-24 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Animated Hero Header */}
        <div className="text-center py-20 lg:py-28 relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-hav-gold/10 rounded-full blur-[100px] pointer-events-none"
          />
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-6xl md:text-8xl font-serif font-black text-hav-forest tracking-tighter leading-none"
          >
            Havikar Partner Hub
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 text-xl md:text-2xl text-hav-olive/70 max-w-2xl mx-auto leading-relaxed font-light"
          >
            Monetize your passion for authentic Indian flavors. Join the circle of elite creators sharing the taste of tradition.
          </motion.p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-hav-olive/10 flex justify-center mb-16">
          <div className="flex gap-4">
            <TabButton tab="leaderboard" label="Hall of Fame" />
            {user?.is_influencer ? (
                <TabButton tab="dashboard" label="Performance Center" />
            ) : (
                <TabButton tab="apply" label="Apply Now" />
            )}
          </div>
        </div>

        {/* Content Area with Animation */}
        <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: activeTab === 'dashboard' ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: activeTab === 'dashboard' ? -50 : 50 }}
                transition={{ duration: 0.5, ease: "anticipate" }}
                className="max-w-6xl mx-auto"
            >
                {activeTab === 'leaderboard' ? (
                    <InfluencerLeaderboard />
                ) : activeTab === 'dashboard' ? (
                    user && user.is_influencer && (
                        <InfluencerDashboard 
                            user={user} 
                            createInfluencerCoupon={createInfluencerCoupon}
                            requestWithdrawal={requestWithdrawal}
                            storeSettings={storeSettings}
                        />
                    )
                ) : (
                    <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-hav-gold/20">
                        {isSuccess ? (
                            <div className="text-center py-12">
                                <CheckCircleIcon className="w-20 h-20 text-green-600 mx-auto mb-6" />
                                <h2 className="text-3xl font-serif font-bold text-hav-forest mb-4">Application Received!</h2>
                                <p className="text-hav-olive mb-8">Thank you for your interest in Havikar. Our team will review your application and get in touch with you within 3-5 business days.</p>
                                <button 
                                    onClick={() => navigateTo('home')}
                                    className="bg-hav-forest text-hav-gold font-bold py-4 px-12 rounded-full shadow-lg hover:brightness-110 transition-all"
                                >
                                    Back to Home
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-hav-forest">Apply to be a Partner</h2>
                                    <p className="mt-4 text-hav-olive">Share the purity and tradition of South Indian flavors with your audience.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-hav-forest">Full Name</label>
                                            <input required type="text" name="name" value={formData.name} onChange={handleChange} className={inputStyles} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-hav-forest">Email Address</label>
                                            <input required type="email" name="email" value={formData.email} onChange={handleChange} className={inputStyles} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-hav-forest">Phone Number</label>
                                            <input required type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className={inputStyles} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-hav-forest">Social Media Link</label>
                                            <input required type="text" name="platform_link" value={formData.platform_link} onChange={handleChange} placeholder="e.g. instagram.com/username" className={inputStyles} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-hav-forest">Followers Count</label>
                                            <input required type="text" name="follower_count" value={formData.follower_count} onChange={handleChange} placeholder="e.g. 10k+" className={inputStyles} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-hav-forest">Audience Type</label>
                                            <input required type="text" name="audience_type" value={formData.audience_type} onChange={handleChange} placeholder="e.g. Foodies, Mothers" className={inputStyles} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-hav-forest">Why Havikar?</label>
                                        <textarea required name="reason_why" rows={3} value={formData.reason_why} onChange={handleChange} className={inputStyles}></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-hav-forest">How will you promote us?</label>
                                        <textarea required name="how_to_promote" rows={3} value={formData.how_to_promote} onChange={handleChange} placeholder="e.g. Recipe Reels, Story Unboxing" className={inputStyles}></textarea>
                                    </div>

                                    <div className="pt-6">
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="w-full bg-hav-forest text-hav-gold font-bold py-4 rounded-full shadow-lg hover:bg-hav-forest/90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                                        >
                                            {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InfluencerPage;
