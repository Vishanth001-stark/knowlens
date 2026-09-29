import React, { useEffect, useState } from 'react';
import {
  Layers,
  ArrowLeft,
  Sparkles,
  GitFork,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { SubjectItem, TopicItem } from '../types';

interface TopicSelectionProps {
  subject: SubjectItem;
  onBack: () => void;
  onStartTopicDiagnostic: (subjectCode: string, topicName: string) => void;
}

export const TopicSelection: React.FC<TopicSelectionProps> = ({
  subject,
  onBack,
  onStartTopicDiagnostic,
}) => {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null);

  useEffect(() => {
    loadTopics();
  }, [subject.id]);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const data = await api.getSubjectTopics(subject.id);
      setTopics(data);
      if (data.length > 0) {
        setSelectedTopic(data[0]);
      }
    } catch (err) {
      console.error('Failed to load topics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button & Subject banner */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            {subject.name}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Choose Topic for Adaptive Diagnostic
          </h1>
        </div>
      </div>

      <p className="text-sm text-slate-400 max-w-3xl">
        When you choose a topic (like "Pointers" or "Memory Model"), the AI diagnostic will systematically test foundational prerequisites first, pinpointing whether struggles originate from earlier concepts.
      </p>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-400">Loading topic modules...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Topics List */}
          <div className="lg:col-span-2 space-y-4">
            {topics.map(topic => {
              const isSelected = selectedTopic?.topic === topic.topic;
              return (
                <div
                  key={topic.topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-white">{topic.topic}</h3>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {topic.concepts.length} Concepts
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {topic.concepts.map(cid => (
                          <span
                            key={cid}
                            className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60"
                          >
                            {cid.replace(/^py_|^ds_|^cn_|^os_|^db_|^math_/, '')}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onStartTopicDiagnostic(subject.code, topic.topic);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center space-x-1 shrink-0 transition-all cursor-pointer"
                    >
                      <span>Diagnose</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Topic Inspector */}
          {selectedTopic && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 h-fit space-y-6">
              <div>
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                  Diagnostic Scope
                </span>
                <h2 className="text-xl font-bold text-white mt-1">{selectedTopic.topic}</h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  The adaptive engine will test prerequisites along with {selectedTopic.topic} questions to distinguish between local errors and prerequisite cascade bottlenecks.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <GitFork className="w-4 h-4 text-cyan-400" />
                  <span>Subtopics & Concepts</span>
                </h4>
                <ul className="space-y-2">
                  {selectedTopic.concepts.map((cid, i) => (
                    <li
                      key={cid}
                      className="text-xs text-slate-300 flex items-center space-x-2 bg-slate-800/60 p-2 rounded-lg border border-slate-700/50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="font-mono text-[11px]">{cid}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>~5-8 min test</span>
                </span>
                <span className="text-emerald-400 font-medium">5-10 Questions</span>
              </div>

              <button
                onClick={() => onStartTopicDiagnostic(subject.code, selectedTopic.topic)}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start {selectedTopic.topic} Diagnostic</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
