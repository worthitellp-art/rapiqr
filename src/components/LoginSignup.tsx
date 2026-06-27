/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ArrowLeft, Loader2, ShieldCheck, QrCode } from 'lucide-react';
import { UserProfile } from '../types';
import MagneticBtn from './ui/MagneticBtn';

interface LoginSignupProps {
  isNewUser: boolean;
  onLoginSuccess: (profile: UserProfile) => void;
  onBack: () => void;
}

export default function LoginSignup({ isNewUser, onLoginSuccess, onBack }: LoginSignupProps) {
  const [isSignMode, setIsSignMode] = useState<'signin' | 'signup'>(isNewUser ? 'signup' : 'signin');
  const [email, setEmail] = useState('mihirrathod95747@gmail.com');
  const [fullName, setFullName] = useState('Mihir Rathod');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please populate all required fields');
      return;
    }
    if (isSignMode === 'signup' && !fullName) {
      setErrorMsg('Full name is required for registration');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      const userProfile: UserProfile = {
        email: email,
        fullName: isSignMode === 'signup' ? fullName : 'Mihir Rathod',
        isLoggedIn: true,
        isSubscribed: true,
        subscriptionPlan: 'pro',
        createdAt: new Date().toISOString(),
      };
      
      onLoginSuccess(userProfile);
      setLoading(false);
    }, 1000);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      const userProfile: UserProfile = {
        email: 'mihirrathod95747@gmail.com',
        fullName: 'Mihir Rathod',
        isLoggedIn: true,
        isSubscribed: true,
        subscriptionPlan: 'pro',
        createdAt: new Date().toISOString(),
      };
      onLoginSuccess(userProfile);
      setLoading(false);
    }, 850);
  };

  return (
    <div id="login-container" className="min-h-screen bg-[#ffffff] flex flex-col md:flex-row font-sans text-black relative">
      
      {/* ── LEFT SIDE: 50% Vibrant Graffiti Mural ── */}
      <div className="w-full md:w-1/2 bg-[#050508] hidden md:flex flex-col justify-between p-12 relative overflow-hidden select-none border-r border-white/10">
        
          {/* Intense vibrant background glow */}
          <div className="absolute top-1/4 left-1/4 w-[120%] h-[120%] bg-gradient-to-br from-[#0070d1]/35 via-[#0070d1]/5 to-transparent filter blur-3xl" />
          
          <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0070d1" />
                <stop offset="100%" stopColor="#53b1ff" />
              </linearGradient>
              {/* Neon Glow Filter */}
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Glowing neon shield shadow (behind the main shield) */}
            <path 
              d="M 180,140 L 320,80 L 460,140 C 460,280 320,370 320,370 C 320,370 180,280 180,140 Z" 
              fill="none" 
              stroke="#0070d1" 
              strokeWidth="12" 
              strokeLinejoin="round" 
              strokeLinecap="round" 
              filter="url(#neonGlow)"
              opacity="0.6"
            />

            {/* Clean Main Shield Outline */}
            <path 
              d="M 180,140 L 320,80 L 460,140 C 460,280 320,370 320,370 C 320,370 180,280 180,140 Z" 
              fill="none" 
              stroke="url(#shieldGrad)" 
              strokeWidth="10" 
              strokeLinejoin="round" 
              strokeLinecap="round" 
            />
            
            {/* Windshield Tag horizontal lines inside shield */}
            <line x1="220" y1="200" x2="420" y2="200" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="1.0" />
            <line x1="240" y1="240" x2="400" y2="240" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="1.0" />
            <line x1="270" y1="280" x2="370" y2="280" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="1.0" />

            {/* Minimalist Spray Paint Drips (Street-art/Graffiti accent) */}
            <path d="M 314,360 L 314,460 C 314,465 326,465 326,460 L 326,360 Z" fill="#0070d1" />
            <circle cx="320" cy="470" r="3.5" fill="#0070d1" />

            <path d="M 270,300 L 270,390 C 270,394 280,394 280,390 L 280,300 Z" fill="#0070d1" opacity="1.0" />
            <circle cx="275" cy="400" r="2.5" fill="#0070d1" opacity="1.0" />

            <path d="M 360,300 L 360,420 C 360,425 370,425 370,420 L 370,300 Z" fill="#d53b00" />
            <circle cx="365" cy="430" r="3" fill="#d53b00" />

            {/* Soft splatters */}
            <circle cx="150" cy="200" r="5" fill="#0070d1" opacity="0.6" />
          </svg>

        {/* Brand Text overlay */}
        <div className="relative z-10">
          <div className="font-serif font-light text-2xl uppercase tracking-tight text-white">
            NAMO<span className="font-bold text-[#0070d1]">QR</span>
          </div>
        </div>

        {/* Bottom Editorial Callout */}
        <div className="relative z-10 max-w-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0070d1] text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
            Secure Platform
          </div>
          <h3 className="text-3xl font-serif font-light text-white leading-tight uppercase">
            Keep your vehicle accessible, privately.
          </h3>
          <p className="text-sm text-white/60 leading-relaxed font-sans">
            Print secure window stickers to receive immediate notifications regarding vehicle security, parking obstruction, or emergency warnings.
          </p>
        </div>
      </div>

      {/* ── RIGHT SIDE: 50% Login/Signup Form ── */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-[#ffffff]">
        
        {/* Back button */}
        <div className="absolute top-6 right-6 z-20">
          <button
            id="back-to-landing-btn"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0070d1] hover:text-[#0064b7] transition-all cursor-pointer uppercase tracking-wider bg-slate-50 px-4 py-2.5 rounded-full border border-slate-200"
          >
            <ArrowLeft size={16} /> Home
          </button>
        </div>

        <div className="w-full max-w-sm">
          {/* Brand header visible only on mobile */}
          <div className="text-center md:hidden mb-6">
            <div className="font-serif font-light text-2xl uppercase tracking-tight mb-2">
              NAMO<span className="font-bold text-[#0070d1]">QR</span>
            </div>
          </div>

          <h2 className="font-serif font-light text-2xl tracking-tight text-black uppercase text-left">
            {isSignMode === 'signin' ? 'Sign in to account' : 'Register Vehicle Portal'}
          </h2>
          
          <p className="mt-2 text-left text-xs text-black/60 font-semibold mb-8">
            Or{' '}
            <button
              id="toggle-sign-mode-btn"
              onClick={() => {
                setIsSignMode(isSignMode === 'signin' ? 'signup' : 'signin');
                setErrorMsg('');
              }}
              className="font-bold text-[#0070d1] hover:underline hover:text-[#0064b7] cursor-pointer uppercase tracking-wider"
            >
              {isSignMode === 'signin' ? 'Get free premium trial' : 'Sign in with existing key'}
            </button>
          </p>

          {errorMsg && (
            <div id="auth-error-box" className="mb-5 p-3.5 bg-red-50 border border-red-200 text-[#c81b3a] text-xs rounded-[4px] font-bold">
              {errorMsg}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isSignMode === 'signup' && (
              <div>
                <label htmlFor="fullname-input" className="block text-[10px] font-bold uppercase tracking-wider text-black/55 mb-1.5 pl-1">
                  Full Name
                </label>
                <div className="relative rounded-[4px]">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/45">
                    <User size={16} />
                  </div>
                  <input
                    id="fullname-input"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Mihir Rathod"
                    className="clay-input w-full"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email-input" className="block text-[10px] font-bold uppercase tracking-wider text-black/55 mb-1.5 pl-1">
                Email Address
              </label>
              <div className="relative rounded-[4px]">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/45">
                  <Mail size={16} />
                </div>
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mihirrathod95747@gmail.com"
                  className="clay-input w-full"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password-input" className="block text-[10px] font-bold uppercase tracking-wider text-black/55 mb-1.5 pl-1">
                Password
              </label>
              <div className="relative rounded-[4px]">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/45">
                  <Lock size={16} />
                </div>
                <input
                  id="password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="clay-input w-full"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            {isSignMode === 'signin' && (
              <div className="flex items-center justify-between pt-1 pb-2">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-[#0070d1] border-[#cccccc] rounded-[4px] focus:ring-[#0070d1]"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-xs text-black/60 select-none font-bold">
                    Remember session
                  </label>
                </div>
                <div className="text-xs">
                  <a href="#" className="font-bold text-[#0070d1] hover:underline">
                    Forgot key?
                  </a>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                id="submit-auth-btn"
                disabled={loading}
                className="w-full py-3.5 clay-button-primary disabled:opacity-50 text-white rounded-full text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider h-11"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-1.5" />
                    Connecting...
                  </>
                ) : (
                  <>
                    {isSignMode === 'signin' ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={16} className="ml-1.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="bg-white px-3 text-black/45 uppercase font-sans tracking-widest font-bold">
                  Secure SSO Option
                </span>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                id="google-login-btn"
                onClick={handleGoogleLogin}
                className="w-full inline-flex justify-center items-center gap-2.5 py-3 px-4 clay-button-secondary text-black text-xs font-bold cursor-pointer uppercase tracking-wider h-11"
              >
                {/* SVG Google G icon */}
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Google Sign-On</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
