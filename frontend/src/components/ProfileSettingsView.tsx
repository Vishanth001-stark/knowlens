import React, { useEffect, useState } from 'react';
import {
  User,
  Sliders,
  Shield,
  Trash2,
  Download,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { StudentProfile, SettingsData } from '../types';

interface ProfileSettingsViewProps {
  profile: StudentProfile | null;
  onRefreshProfile: () => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  profile,
  onRefreshProfile,
}) => {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteSuccess, setDeleteSuccess] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (key: keyof SettingsData['weights'], val: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      weights: {
        ...settings.weights,
        [key]: val,
      },
    });
  };

  const handleSaveWeights = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      await api.updateSettings(settings.weights);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHistory = async () => {
    if (!window.confirm('Are you sure you want to permanently wipe all student learning logs, responses, and session records?')) {
      return;
    }
    try {
      setIsDeleting(true);
      await api.deleteHistory(profile?.student_id || 1);
      setDeleteSuccess(true);
      onRefreshProfile();
      setTimeout(() => setDeleteSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to delete history:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportData = () => {
    if (!profile) return;
    const blob = new Blob([JSON.stringify({ profile, settings }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `confusion_detector_profile_${profile.student_id}.json`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
          <span>Configuration & Privacy</span>
          <span>•</span>
          <span>Student Settings</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Profile & Scoring Engine Settings
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          Manage your student profile, configure custom weighting factors for the Learning Difficulty Score, and enforce privacy data retention policies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{profile?.student_name || 'Vishanth R'}</h2>
              <span className="text-xs text-slate-400">Student ID: #{profile?.student_id || 1}</span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Active Subjects:</span>
              <span className="font-semibold text-white">7 Available</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Overall Understanding:</span>
              <span className="font-semibold text-indigo-400">{profile?.overall_understanding || 78}%</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Total Tracked Concepts:</span>
              <span className="font-semibold text-white">
                {(profile?.concepts_mastered || 0) + (profile?.concepts_strong || 0) + (profile?.concepts_developing || 0) + (profile?.concepts_at_risk || 0) + (profile?.concepts_confused || 0)}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Data Privacy Status:</span>
              <span className="font-semibold text-emerald-400">Local & Sandboxed</span>
            </div>
          </div>

          <button
            onClick={handleExportData}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Learning Records (JSON)</span>
          </button>
        </div>

        {/* Scoring Engine Configurator (Section 11) */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Learning Difficulty Score Weights</h3>
                <span className="text-xs text-slate-400">
                  Configure how behavioral signals combine into the Learning Difficulty Score
                </span>
              </div>
            </div>

            <button
              onClick={handleSaveWeights}
              disabled={saving || !settings}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving...' : 'Save Weights'}</span>
            </button>
          </div>

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Weighting coefficients updated successfully.</span>
            </div>
          )}

          {settings && (
            <div className="space-y-5 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Incorrect Answers Weight</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {(settings.weights.weight_incorrect * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={settings.weights.weight_incorrect}
                  onChange={e => handleWeightChange('weight_incorrect', parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Repeated Errors Weight</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {(settings.weights.weight_repeated_errors * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={settings.weights.weight_repeated_errors}
                  onChange={e => handleWeightChange('weight_repeated_errors', parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Low Confidence Gap Weight</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {(settings.weights.weight_low_confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={settings.weights.weight_low_confidence}
                  onChange={e => handleWeightChange('weight_low_confidence', parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Unusual Response Time Latency</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {(settings.weights.weight_response_time * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={settings.weights.weight_response_time}
                  onChange={e => handleWeightChange('weight_response_time', parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Repeated Hints Dependency</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {(settings.weights.weight_hint_dependency * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={settings.weights.weight_hint_dependency}
                  onChange={e => handleWeightChange('weight_hint_dependency', parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Prerequisite Weakness Weight</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {(settings.weights.weight_prerequisite_weakness * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={settings.weights.weight_prerequisite_weakness}
                  onChange={e => handleWeightChange('weight_prerequisite_weakness', parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Privacy Section (Section 28) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-rose-900/30 space-y-4">
        <div className="flex items-center space-x-3 text-rose-400">
          <Shield className="w-5 h-5" />
          <h3 className="text-base font-bold text-white">Student Privacy & Data Retention</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Student responses, question logs, and concept diagnostics belong to the student. No unnecessary personal identifying data is collected or sent to external model APIs. You can permanently wipe your entire history at any time.
        </p>

        {deleteSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>All student learning records permanently deleted.</span>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleDeleteHistory}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Wiping Learning History...' : 'Permanently Delete Learning History'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
