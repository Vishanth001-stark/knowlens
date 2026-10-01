import React, { useState, useEffect } from 'react';
import { Sparkles, User, Mail, ArrowRight, ShieldCheck, UploadCloud, Compass, Plus, Check, LogIn, X } from 'lucide-react';
import { StudentUser } from '../types';

interface SavedGoogleAccount {
  name: string;
  email: string;
  avatarUrl?: string;
}

interface LoginPageProps {
  onGoogleLogin: (name: string, email: string) => Promise<void>;
  onDirectLogin: (name: string, email: string) => Promise<void>;
  onExploreGuest: () => void;
  isLoading: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onGoogleLogin,
  onDirectLogin,
  onExploreGuest,
  isLoading,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Google Account Chooser Modal state
  const [isGoogleChooserOpen, setIsGoogleChooserOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedGoogleAccount[]>(() => {
    try {
      const saved = localStorage.getItem('knowlens_saved_google_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    try {
      await onDirectLogin(name.trim(), email.trim());
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  const handleOpenGoogleAuth = () => {
    setError(null);
    // If user has saved accounts, show account chooser modal
    // Otherwise open the new account sign in directly
    if (savedAccounts.length > 0) {
      setShowAddAccountForm(false);
    } else {
      setShowAddAccountForm(true);
    }
    setIsGoogleChooserOpen(true);
  };

  const handleSelectGoogleAccount = async (account: SavedGoogleAccount) => {
    setError(null);
    try {
      await onGoogleLogin(account.name, account.email);
      setIsGoogleChooserOpen(false);
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    }
  };

  const handleNewGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmailInput.trim() || !googleEmailInput.includes('@')) {
      setError('Please enter a valid Google email address.');
      return;
    }
    const cleanEmail = googleEmailInput.trim();
    const cleanName = googleNameInput.trim() || cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Save to device's Google accounts for quick re-login
    const updatedAccounts = [
      { name: cleanName, email: cleanEmail },
      ...savedAccounts.filter(acc => acc.email.toLowerCase() !== cleanEmail.toLowerCase()),
    ].slice(0, 5);

    try {
      localStorage.setItem('knowlens_saved_google_accounts', JSON.stringify(updatedAccounts));
      setSavedAccounts(updatedAccounts);
    } catch (e) {
      console.error(e);
    }

    try {
      await onGoogleLogin(cleanName, cleanEmail);
      setIsGoogleChooserOpen(false);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
    }
  };


  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Brand Banner */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>KnowLens AI Confusion Detector</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Sign In to Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">
              Learning Portal
            </span>
          </h1>

          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Diagnose concept bottlenecks, upload course documents, and discover the prerequisite root causes behind mistakes.
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleOpenGoogleAuth}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase tracking-wider font-semibold shrink-0">
              Or sign in with email
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* Direct Form */}
          <form onSubmit={handleDirectSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Your Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{isLoading ? 'Accessing Dashboard...' : 'Enter Student Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Guest / Explore Alternative */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onExploreGuest}
            className="text-xs text-slate-400 hover:text-indigo-300 font-medium inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Or explore course catalog as guest</span>
          </button>
        </div>

        {/* Educational Features Highlights */}
        <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs text-slate-400">
          <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex flex-col items-center space-y-1">
            <span className="font-semibold text-slate-200">DAG Tracing</span>
            <span className="text-[11px] text-slate-500">Prerequisite discovery</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex flex-col items-center space-y-1">
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-200">PDF Scanner</span>
            <span className="text-[11px] text-slate-500">Document diagnostics</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex flex-col items-center space-y-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">Personalized</span>
            <span className="text-[11px] text-slate-500">Adaptive assessments</span>
          </div>
        </div>
      </div>

      {/* Authentic Google Account Selector Modal */}
      {isGoogleChooserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5 border border-slate-200">
            {/* Close button */}
            <button
              onClick={() => setIsGoogleChooserOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Google Header */}
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <svg className="w-9 h-9" viewBox="0 0 24 24">
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
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                {showAddAccountForm ? 'Sign in with Google' : 'Choose an account'}
              </h3>
              <p className="text-xs text-slate-600">
                to continue to <strong className="text-indigo-600">KnowLens</strong>
              </p>
            </div>

            {/* Account List (if user has accounts and not adding new) */}
            {!showAddAccountForm && (
              <div className="space-y-2">
                <div className="divide-y divide-slate-100 border-y border-slate-100 max-h-60 overflow-y-auto">
                  {savedAccounts.map((acc, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectGoogleAccount(acc)}
                      disabled={isLoading}
                      className="w-full py-3 px-2 flex items-center space-x-3 text-left hover:bg-slate-50 transition-colors rounded-lg cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                        {acc.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{acc.name}</div>
                        <div className="text-xs text-slate-500 truncate">{acc.email}</div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Option to use another account */}
                <button
                  type="button"
                  onClick={() => setShowAddAccountForm(true)}
                  className="w-full py-3 px-2 flex items-center space-x-3 text-left hover:bg-slate-50 transition-colors rounded-lg text-slate-700 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 border border-slate-200">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-800">Use another account</span>
                </button>
              </div>
            )}

            {/* Add New Account Form */}
            {showAddAccountForm && (
              <form onSubmit={handleNewGoogleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Google Email
                  </label>
                  <input
                    type="email"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    placeholder="Enter your Gmail address"
                    required
                    autoFocus
                    className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Your Name (as displayed on Google)
                  </label>
                  <input
                    type="text"
                    value={googleNameInput}
                    onChange={(e) => setGoogleNameInput(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  {savedAccounts.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setShowAddAccountForm(false)}
                      className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                    >
                      ← Back to accounts
                    </button>
                  ) : <div />}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying...' : 'Next'}
                  </button>
                </div>
              </form>
            )}

            <div className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-100">
              To continue, Google will share your name, email address, and profile with KnowLens.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
