
import React, { useState } from 'react';
import { AuthCredentials, Page } from '../types';
import EyeIcon from '../components/icons/EyeIcon';
import EyeOffIcon from '../components/icons/EyeOffIcon';
import { supabase } from '../supabaseClient';

interface LoginPageProps {
  onLogin: (credentials: AuthCredentials) => Promise<boolean>;
  navigateTo: (page: Page) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, navigateTo }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await onLogin({ loginId, password });
    if (success) {
      const redirect = sessionStorage.getItem('loginRedirect');
      if (redirect) {
        sessionStorage.removeItem('loginRedirect');
        window.location.href = redirect;
      } else {
        navigateTo('profile');
      }
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    try {
      // Use window.location.origin as the base, but ensure it's correct for the environment
      const redirectTo = window.location.origin;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      alert(err.message || "Failed to initiate Google login");
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-hav-cream py-12 px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-hav-gold/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-black text-hav-forest">Welcome Back</h1>
          <p className="text-hav-olive/60 mt-2 font-medium">Continue your journey with Havikar</p>
        </div>

        <div className="mb-8">
          <button 
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-200 py-4 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-hav-gold/50 transition-all shadow-sm active:scale-95"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
              />
            </svg>
            <span className="text-base">Sign in with Google</span>
          </button>
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center text-xs uppercase tracking-[0.2em]"><span className="bg-white px-4 text-gray-400 font-black">Or use email</span></div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-hav-gold mb-2 ml-1">Email or Mobile Number</label>
            <input
              type="text"
              required
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="e.g. ananya@example.com or 9876543210"
              className="appearance-none block w-full px-5 py-4 border-2 border-hav-orange-50 rounded-2xl bg-hav-cream/30 focus:outline-none focus:ring-4 focus:ring-hav-gold/10 focus:border-hav-gold/50 transition-all font-bold text-hav-forest"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-hav-gold mb-2 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-5 py-4 border-2 border-hav-orange-50 rounded-2xl bg-hav-cream/30 focus:outline-none focus:ring-4 focus:ring-hav-gold/10 focus:border-hav-gold/50 transition-all font-bold text-hav-forest"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-5 flex items-center">
                {showPassword ? <EyeOffIcon className="h-5 w-5 text-gray-400" /> : <EyeIcon className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-5 px-4 bg-hav-forest text-hav-gold rounded-full shadow-xl text-sm font-black uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 disabled:bg-gray-300 transition-all"
          >
            {isLoading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-10 text-center text-sm font-bold text-hav-olive/60">
            New here? <button onClick={() => navigateTo('signup')} className="text-hav-gold hover:text-hav-forest underline underline-offset-4 decoration-2">Create Account</button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
