import {
  Brain,
  Sparkles,
  Activity,
  Map,
  BarChart3,
  RotateCcw,
  BookOpen,
  History,
  ShieldCheck,
  Flame,
  Sliders,
  UploadCloud,
  User,
} from 'lucide-react';
import { StudentUser } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onLoadDemo: () => void;
  isLoadingDemo: boolean;
  activeSubjectName?: string;
  studentUser: StudentUser | null;
  onOpenLogin: () => void;
  onOpenUploadDoc: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onLoadDemo,
  isLoadingDemo,
  activeSubjectName = 'C Programming',
  studentUser,
  onOpenLogin,
  onOpenUploadDoc,
  onSignOut,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-40 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => setCurrentTab('landing')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-100 tracking-tight">KnowLens</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI Diagnostic
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden lg:block">Don't just tell students the answer. Find out why they are confused.</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentTab('subjects')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
              currentTab === 'subjects' || currentTab === 'topics'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Subjects</span>
          </button>

          <button
            onClick={() => setCurrentTab('diagnostic')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
              currentTab === 'diagnostic'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Diagnostic</span>
          </button>

          <button
            onClick={() => setCurrentTab('confusion_analysis')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
              currentTab === 'confusion_analysis'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Root Cause</span>
          </button>

          <button
            onClick={() => setCurrentTab('confusion_map')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
              currentTab === 'confusion_map'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Concept Map</span>
          </button>

          <button
            onClick={() => setCurrentTab('analytics')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
              currentTab === 'analytics'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Analytics</span>
          </button>

          <button
            onClick={() => setCurrentTab('history')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
              currentTab === 'history'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">History</span>
          </button>

          <button
            onClick={() => setCurrentTab('evaluation')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
              currentTab === 'evaluation'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Benchmark</span>
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Settings</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Active Subject Badge */}
          <div
            onClick={() => setCurrentTab('subjects')}
            className="hidden xl:flex items-center space-x-1.5 text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200">{activeSubjectName}</span>
          </div>

          {/* Upload Notes Button */}
          <button
            onClick={onOpenUploadDoc}
            className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all cursor-pointer"
            title="Upload lecture notes or PDF for AI confusion scanning"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload Notes</span>
          </button>

          {/* Quick Load Demo Button */}
          <button
            onClick={onLoadDemo}
            disabled={isLoadingDemo}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer"
            title="Load synthetic student data with diagnosed pointer misconceptions"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoadingDemo ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoadingDemo ? 'Loading...' : 'Demo Student'}</span>
          </button>

          {/* Student Profile / Sign In Button */}
          {studentUser ? (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-all cursor-pointer"
                title="Click to view profile or switch account"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm">
                  {studentUser.name.charAt(0)}
                </div>
                <span className="max-w-[100px] truncate hidden md:inline">{studentUser.name}</span>
              </button>
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs transition-colors cursor-pointer"
                  title="Sign out of student portal"
                >
                  Sign Out
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setCurrentTab('login')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
