import React, { useState } from 'react';
import { User, Page, InfluencerApplicationInsert } from '../types';
import { supabase } from '../supabaseClient';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';

interface InfluencerApplyPageProps {
  user: User | null;
  navigateTo: (page: Page) => void;
}

const InfluencerApplyPage: React.FC<InfluencerApplyPageProps> = ({ user, navigateTo }) => {
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const inputStyles = "mt-1 block w-full border border-hav-orange-200 rounded-md shadow-sm py-2 px-3 focus:ring-hav-forest focus:border-hav-forest bg-white";

  if (isSuccess) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-hav-cream py-12 px-4">
        <div className="max-w-md w-full bg-white p-12 rounded-2xl shadow-xl text-center">
            <CheckCircleIcon className="w-20 h-20 text-green-600 mx-auto mb-6" />
            <h1 className="text-3xl font-serif font-bold text-hav-forest mb-4">Application Received!</h1>
            <p className="text-hav-olive mb-8">Thank you for your interest in Havikar. Our team will review your application and get in touch with you via email or phone within 3-5 business days.</p>
            <button 
                onClick={() => navigateTo('home')}
                className="w-full bg-hav-forest text-hav-gold font-bold py-4 rounded-full shadow-lg hover:brightness-110 transition-all"
            >
                Back to Home
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hav-cream py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-hav-gold/20">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-hav-forest">Apply to be a Havikar Partner</h1>
          <p className="mt-4 text-hav-olive">Share the purity and tradition of South Indian flavors with your audience.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-hav-forest">Full Name</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className={inputStyles} />
            </div>
            <div>
              <label className="block text-sm font-bold text-hav-forest">Email Address (Registered with us)</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className={inputStyles} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-hav-forest">Phone Number</label>
              <input required type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className={inputStyles} />
            </div>
            <div>
              <label className="block text-sm font-bold text-hav-forest">Instagram / YouTube / Page Link</label>
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
              <input required type="text" name="audience_type" value={formData.audience_type} onChange={handleChange} placeholder="e.g. Foodies, Mothers, Fitness" className={inputStyles} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-hav-forest">Why do you want to promote Havikar?</label>
            <textarea required name="reason_why" rows={3} value={formData.reason_why} onChange={handleChange} className={inputStyles}></textarea>
          </div>

          <div>
            <label className="block text-sm font-bold text-hav-forest">How will you promote Havikar to your audience?</label>
            <textarea required name="how_to_promote" rows={3} value={formData.how_to_promote} onChange={handleChange} placeholder="e.g. Recipe Reels, Story Unboxing, Blog Posts" className={inputStyles}></textarea>
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
      </div>
    </div>
  );
};

export default InfluencerApplyPage;