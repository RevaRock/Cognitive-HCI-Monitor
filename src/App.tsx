/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Brain, 
  MousePointer2, 
  Keyboard, 
  ScrollText, 
  Clock, 
  ChevronRight,
  RefreshCw,
  Info,
  AlertCircle,
  CheckCircle2,
  Zap,
  Coffee,
  Target,
  Frown
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useInteractionTracker, InteractionMetrics } from './hooks/useInteractionTracker';
import { inferCognitiveState, CognitiveState } from './services/cognitiveService';

const STATE_CONFIG = {
  Focused: { icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Focused' },
  Flow: { icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', label: 'In Flow' },
  Fatigued: { icon: Coffee, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Fatigued' },
  Frustrated: { icon: Frown, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', label: 'Frustrated' },
  Distracted: { icon: AlertCircle, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Distracted' },
};

export default function App() {
  const currentMetrics = useInteractionTracker();
  const [history, setHistory] = useState<InteractionMetrics[]>([]);
  const [cognitiveState, setCognitiveState] = useState<CognitiveState | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<number>(0);

  // Update history
  useEffect(() => {
    setHistory(prev => {
      const newHistory = [...prev, currentMetrics].slice(-30);
      return newHistory;
    });
  }, [currentMetrics]);

  // Periodic analysis
  useEffect(() => {
    const now = Date.now();
    if (history.length >= 5 && now - lastAnalysisTime > 15000) {
      handleAnalysis();
    }
  }, [history]);

  const handleAnalysis = async () => {
    if (history.length < 2) return;
    setIsAnalyzing(true);
    try {
      const result = await inferCognitiveState(history);
      setCognitiveState(result);
      setLastAnalysisTime(Date.now());
    } finally {
      setIsAnalyzing(false);
    }
  };

  const StateIcon = cognitiveState ? STATE_CONFIG[cognitiveState.state].icon : Brain;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Brain className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Cognitive HCI Monitor</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Behavioral Analytics Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
              <div className={`w-2 h-2 rounded-full animate-pulse ${currentMetrics.idleTime > 10 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span className="text-xs font-semibold text-gray-600">
                {currentMetrics.idleTime > 10 ? 'Idle' : 'Active Monitoring'}
              </span>
            </div>
            <button 
              onClick={handleAnalysis}
              disabled={isAnalyzing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-gray-500 ${isAnalyzing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Real-time Interaction Metrics */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Live Interaction Traces
            </h2>
            
            <div className="space-y-4">
              <MetricCard 
                icon={MousePointer2} 
                label="Mouse Velocity" 
                value={`${currentMetrics.mouseVelocity} px/s`} 
                color="blue"
              />
              <MetricCard 
                icon={RefreshCw} 
                label="Click Frequency" 
                value={`${currentMetrics.clickFrequency} cpm`} 
                color="emerald"
              />
              <MetricCard 
                icon={Keyboard} 
                label="Typing Speed" 
                value={`${currentMetrics.typingSpeed} cpm`} 
                color="purple"
              />
              <MetricCard 
                icon={ScrollText} 
                label="Scroll Jitter" 
                value={currentMetrics.scrollJitter} 
                color="amber"
              />
              <MetricCard 
                icon={Clock} 
                label="Idle Time" 
                value={`${currentMetrics.idleTime}s`} 
                color="slate"
              />
            </div>
          </section>

          <section className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-100">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" /> Why this matters?
            </h3>
            <p className="text-sm text-blue-100 leading-relaxed">
              Subtle changes in how you move your mouse or type can reveal cognitive load, fatigue, or frustration before you even notice them.
            </p>
          </section>
        </div>

        {/* Right Column: Cognitive State & Trends */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Cognitive State Card */}
          <AnimatePresence mode="wait">
            {cognitiveState ? (
              <motion.div 
                key={cognitiveState.state}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`rounded-3xl border ${STATE_CONFIG[cognitiveState.state].border} ${STATE_CONFIG[cognitiveState.state].bg} p-8 shadow-sm`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center ${STATE_CONFIG[cognitiveState.state].color}`}>
                      <StateIcon className="w-10 h-10" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-60">Current State</span>
                        <div className="px-2 py-0.5 rounded-full bg-white/50 text-[10px] font-bold border border-black/5">
                          {Math.round(cognitiveState.confidence * 100)}% Confidence
                        </div>
                      </div>
                      <h2 className={`text-4xl font-black tracking-tight ${STATE_CONFIG[cognitiveState.state].color}`}>
                        {STATE_CONFIG[cognitiveState.state].label}
                      </h2>
                    </div>
                  </div>
                  
                  <div className="flex-1 max-w-md">
                    <p className="text-gray-700 font-medium leading-relaxed italic">
                      "{cognitiveState.reasoning}"
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cognitiveState.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white/40 p-3 rounded-xl border border-white/60">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${STATE_CONFIG[cognitiveState.state].color}`} />
                      <span className="text-sm font-semibold text-gray-700">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="rounded-3xl border border-dashed border-gray-300 p-12 flex flex-col items-center justify-center text-center bg-gray-50">
                <Brain className="w-12 h-12 text-gray-300 mb-4 animate-pulse" />
                <h3 className="text-lg font-bold text-gray-400">Collecting Interaction Data...</h3>
                <p className="text-sm text-gray-400 max-w-xs mt-2">
                  Interact with the page (move mouse, scroll, type) to generate a behavioral profile for analysis.
                </p>
              </div>
            )}
          </AnimatePresence>

          {/* Interaction Trends */}
          <section className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold tracking-tight">Interaction Dynamics</h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-gray-500">Velocity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-gray-500">Typing</span>
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorVel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTyp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="timestamp" 
                    hide 
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="mouseVelocity" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorVel)" 
                    animationDuration={1000}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="typingSpeed" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorTyp)" 
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Interactive Sandbox */}
          <section className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Interaction Sandbox</h2>
            <p className="text-sm text-gray-500 mb-6">Type something here or move your mouse erratically to see how the metrics change.</p>
            <textarea 
              className="w-full h-32 p-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-700 font-medium"
              placeholder="Start typing to generate interaction data..."
            />
          </section>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-gray-400">
            <Brain className="w-5 h-5" />
            <span className="text-sm font-bold tracking-tight">Cognitive HCI Monitor v1.0</span>
          </div>
          <div className="flex gap-8">
            <FooterLink label="Privacy Policy" />
            <FooterLink label="Methodology" />
            <FooterLink label="API Docs" />
          </div>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    purple: 'text-purple-600 bg-purple-50',
    amber: 'text-amber-600 bg-amber-50',
    slate: 'text-slate-600 bg-slate-50',
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-bold text-gray-500 group-hover:text-gray-700 transition-colors">{label}</span>
      </div>
      <span className="text-lg font-black tracking-tight text-gray-900">{value}</span>
    </div>
  );
}

function FooterLink({ label }: { label: string }) {
  return (
    <a href="#" className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
      {label}
    </a>
  );
}
