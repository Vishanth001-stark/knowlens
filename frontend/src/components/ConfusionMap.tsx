import React, { useState, useEffect } from 'react';
import {
  Map,
  GitBranch,
  Layers,
  ChevronRight,
  Flame,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { ConceptGraphData, GraphNode } from '../types';

interface ConfusionMapProps {
  onOpenEvidence: (conceptId: string) => void;
  onStartRecovery: (conceptId: string) => void;
}

export const ConfusionMap: React.FC<ConfusionMapProps> = ({
  onOpenEvidence,
  onStartRecovery,
}) => {
  const [graphData, setGraphData] = useState<ConceptGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('c_programming');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGraph();
  }, [selectedSubject]);

  const loadGraph = async () => {
    try {
      setIsLoading(true);
      const data = await api.getConceptGraph(1, selectedSubject);
      setGraphData(data);
      if (data.nodes.length > 0) {
        // Default to a weak concept if available, otherwise first
        const weak = data.nodes.find(n => n.status === 'CONFUSED' || n.status === 'AT_RISK');
        setSelectedNode(weak || data.nodes[0]);
      } else {
        setSelectedNode(null);
      }
    } catch (err) {
      console.error('Failed to load concept graph:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !graphData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400">Rendering knowledge graph architecture...</p>
        </div>
      </div>
    );
  }

  const modules = ['All', ...Array.from(new Set(graphData.nodes.map(n => n.module)))];
  const filteredNodes = selectedModule === 'All'
    ? graphData.nodes
    : graphData.nodes.filter(n => n.module === selectedModule);

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'MASTERED':
        return 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:border-emerald-400';
      case 'STRONG':
        return 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 hover:border-cyan-400';
      case 'DEVELOPING':
        return 'bg-blue-950/40 border-blue-500/50 text-blue-300 hover:border-blue-400';
      case 'AT_RISK':
        return 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:border-amber-400';
      case 'CONFUSED':
        return 'bg-rose-950/40 border-rose-500/60 text-rose-300 hover:border-rose-400 animate-pulse';
      default:
        return 'bg-slate-900 border-slate-700 text-slate-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'MASTERED':
      case 'STRONG':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'DEVELOPING':
        return <HelpCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'AT_RISK':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'CONFUSED':
        return <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Interactive Concept DAG
            </span>
            <span>•</span>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="bg-slate-800 text-xs text-white font-semibold px-2 py-0.5 rounded border border-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="c_programming">C Programming</option>
              <option value="python">Python</option>
              <option value="mathematics">Mathematics</option>
              <option value="data_structures">Data Structures</option>
              <option value="computer_networks">Computer Networks</option>
              <option value="operating_systems">Operating Systems</option>
              <option value="database_systems">Database Systems</option>
            </select>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Confusion & Prerequisite Knowledge Map
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Traverse concept dependencies. Click any node to inspect prerequisite bottlenecks and empirical performance.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center space-x-1.5 px-2 py-1 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Mastered</span>
          </span>
          <span className="flex items-center space-x-1.5 px-2 py-1 rounded bg-cyan-950/30 border border-cyan-500/30 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Strong</span>
          </span>
          <span className="flex items-center space-x-1.5 px-2 py-1 rounded bg-blue-950/30 border border-blue-500/30 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>Developing</span>
          </span>
          <span className="flex items-center space-x-1.5 px-2 py-1 rounded bg-amber-950/30 border border-amber-500/30 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>At Risk</span>
          </span>
          <span className="flex items-center space-x-1.5 px-2 py-1 rounded bg-rose-950/30 border border-rose-500/40 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>Confused</span>
          </span>
        </div>
      </div>

      {/* Module Filters */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        {modules.map(mod => (
          <button
            key={mod}
            onClick={() => setSelectedModule(mod)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedModule === mod
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {mod}
          </button>
        ))}
      </div>

      {/* Main Grid: Interactive Graph Nodes (Left) & Inspector (Right) */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Nodes Canvas Grid (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Showing {filteredNodes.length} Concepts</span>
            <span className="font-mono text-slate-500">Prerequisite DAG Directed Flow</span>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredNodes.map(node => {
              const isSelected = selectedNode?.id === node.id;
              const colorClass = getNodeColor(node.status);

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${colorClass} ${
                    isSelected ? 'ring-2 ring-indigo-400 shadow-lg scale-[1.02]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      {node.module}
                    </span>
                    {getStatusIcon(node.status)}
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 line-clamp-1">{node.name}</h3>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80 text-[11px]">
                    <span className="text-slate-400">
                      Acc: <strong className="text-slate-200">{node.accuracy}%</strong>
                    </span>
                    <span className="text-slate-400">
                      Conf: <strong className="text-slate-200">{node.confidence}%</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Inspector Drawer (1 col) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          {selectedNode ? (
            <>
              <div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{selectedNode.module}</span>
                </div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  {selectedNode.name}
                </h2>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getNodeColor(selectedNode.status)}`}>
                    {selectedNode.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedNode.attempts} recorded attempts
                  </span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block">Demonstrated Accuracy</span>
                  <strong className="text-base text-white font-mono">{selectedNode.accuracy}%</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Average Confidence</span>
                  <strong className="text-base text-white font-mono">{selectedNode.confidence}%</strong>
                </div>
              </div>

              {/* Prerequisites Chain */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                  <span>Direct Prerequisites</span>
                </h4>

                {selectedNode.prerequisites && selectedNode.prerequisites.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedNode.prerequisites.map(p_id => {
                      const p_node = graphData.nodes.find(n => n.id === p_id);
                      return (
                        <div
                          key={p_id}
                          onClick={() => p_node && setSelectedNode(p_node)}
                          className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 cursor-pointer transition-colors"
                        >
                          <span className="font-semibold text-slate-200">{p_node?.name || p_id}</span>
                          <span className="text-[11px] text-slate-400">{p_node?.status || 'Active'}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No prior prerequisites (Fundamental root concept).</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                {(selectedNode.status === 'CONFUSED' || selectedNode.status === 'AT_RISK') && (
                  <button
                    onClick={() => onOpenEvidence(selectedNode.id)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>Why was this detected?</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => onStartRecovery(selectedNode.id)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>Start Targeted Recovery</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              Select a node in the graph to view details and prerequisites.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
