import React, { useState } from 'react';
import { X, Sparkles, User, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { StudentUser } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: StudentUser) => void;
  onGoogleLogin: (name: string, email: string) => Promise<void>;
  onDirectLogin: (name: string, email: string) => Promise<void>;
  isLoading: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onGoogleLogin,
  onDirectLogin,
  isLoading,
}) => {
  const [name, setName] = useState('Vishanth R');
  const [email, setEmail] = useState('vishanth@example.com');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    try {
      await onDirectLogin(name.trim(), email.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  const handleGoogleClick = async () => {
    setError(null);
    try {
      const googleName = name.trim() || 'Vishanth R';
      const googleEmail = email.trim() || 'vishanth@gmail.com';
      await onGoogleLogin(googleName, googleEmail);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
    }
  };

  const handleQuickPreset = (presetName: string, presetEmail: string) => {
    setName(presetName);
    setEmail(presetEmail);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Confusion Detector</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {isSignUp ? 'Create Student Account' : 'Student Sign In'}
          </h2>
          <p className="text-xs text-slate-400">
            Sign in to track your personalized concept graph, upload study materials, and detect confusion root causes.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-center space-x-3 transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {/* Official Google G Icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full"></div>
          <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
            or enter your details
          </span>
          <div className="border-t border-slate-800 w-full"></div>
        </div>

        {/* Direct Name & Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vishanth R"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <p className="text-[11px] text-slate-500">
              This name will be displayed on your diagnostic dashboard and reports.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vishanth@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{isLoading ? 'Signing In...' : 'Enter Student Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Student Preset Badges */}
        <div className="pt-2 border-t border-slate-800">
          <p className="text-[11px] text-slate-400 mb-2 font-medium">Quick sign-in profiles:</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickPreset('Vishanth R', 'vishanth@example.com')}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-colors cursor-pointer"
            >
              Vishanth R (Student)
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('Alex Chen', 'alex.chen@univ.edu')}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              Alex Chen
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('Priya Sharma', 'priya.s@tech.edu')}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              Priya Sharma
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local storage session • Zero advertising • Full privacy</span>
        </div>
      </div>
    </div>
  );
};
