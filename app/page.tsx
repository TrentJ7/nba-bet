"use client";
import { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Minus, Trophy, Activity, Hash, Layers, Zap, ExternalLink } from 'lucide-react';
import { PropPrediction } from '@/lib/types';

type StatTab = 'points' | 'rebounds' | 'assists';

export default function NBADashboard() {
  const [allProps, setAllProps] = useState<PropPrediction[]>([]);
  const [activeTab, setActiveTab] = useState<StatTab>('points');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Initial Data Fetch
  useEffect(() => {
    async function initFetch() {
      setLoading(true);
      try {
        const res = await fetch('/api/props');
        const data = await res.json();
        setAllProps(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load props", err);
      } finally {
        setLoading(false);
      }
    }
    initFetch();
  }, []);

  // 2. Refined Search & Tab Filtering Logic
  const filteredProps = useMemo(() => {
    return allProps.filter((prop) => {
      const matchesTab = prop.metric.toLowerCase().includes(activeTab);
      const matchesSearch = prop.player.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            prop.team.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [allProps, activeTab, searchTerm]);

  return (
    <main className="min-h-screen bg-[#050505] text-slate-200 p-4 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="text-orange-500 fill-orange-500" size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Multi-Bookie Prediction Engine</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase italic">Prop Edge<span className="text-orange-500 not-italic">.</span></h1>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
            {/* Tab Switcher */}
            <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              {(['points', 'rebounds', 'assists'] as StatTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === tab 
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' 
                    : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Refined Search Bar */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Search players or teams..."
                className="w-full md:w-64 bg-slate-900/50 border border-slate-800 rounded-xl py-2.5 pl-12 pr-4 focus:outline-none focus:border-orange-500/50 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Stats Dashboard */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Activity className="animate-spin text-orange-500 mb-4" size={32} />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Scanning Market Lines...</p>
          </div>
        ) : filteredProps.length === 0 ? (
          <div className="text-center py-32 bg-slate-900/10 border border-dashed border-slate-800 rounded-3xl">
            <Layers className="mx-auto mb-4 text-slate-800" size={40} />
            <p className="text-slate-600 uppercase text-xs font-bold tracking-widest">No {activeTab} value found for "{searchTerm}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {/* Legend / Table Header */}
            <div className="hidden md:flex px-6 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
              <div className="w-1/3 text-left">Player / Matchup</div>
              <div className="w-1/3 text-center">Market Edge (Best Line vs Proj)</div>
              <div className="w-1/3 text-right">Recommendation</div>
            </div>

            {filteredProps.map((prop) => (
              <div 
                key={prop.id} 
                className="bg-[#0c0c0c] border border-slate-800/40 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between hover:border-orange-500/30 transition-all group"
              >
                {/* Left: Player Identity */}
                <div className="flex items-center gap-4 w-full md:w-1/3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-700 font-bold border border-slate-800 group-hover:border-orange-500/50 group-hover:text-orange-500 transition-all">
                    <Hash size={16} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{prop.player}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-orange-500 uppercase">{prop.team}</span>
                      <span className="text-slate-700">•</span>
                      <span className="text-[10px] font-medium text-slate-500 uppercase">{prop.metric.replace('player_', '')}</span>
                    </div>
                  </div>
                </div>

                {/* Center: The Best Line & Edge */}
                <div className="flex items-center justify-center gap-10 py-6 md:py-0 w-full md:w-1/3 border-y md:border-y-0 md:border-x border-slate-800/50 my-4 md:my-0">
                  <div className="text-center">
                    <p className="text-[9px] text-slate-600 uppercase font-black mb-1">Best Line</p>
                    <p className="text-xl font-mono font-bold text-slate-400">{prop.line}</p>
                    {/* Multi-Bookie Source */}
                    <p className="text-[8px] font-bold text-orange-500/80 uppercase mt-1 tracking-tighter">@{prop.bookie || 'Market'}</p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="h-px w-8 bg-slate-800 mb-4" />
                    <div className={`text-[10px] font-bold ${parseFloat(prop.edge) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {parseFloat(prop.edge) > 0 ? '+' : ''}{prop.edge}%
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-[9px] text-slate-600 uppercase font-black mb-1">Model Proj</p>
                    <p className="text-xl font-mono font-bold text-white underline decoration-orange-500 decoration-2 underline-offset-4">{prop.projection}</p>
                  </div>
                </div>

                {/* Right: Action Area */}
                <div className="flex flex-col items-center md:items-end w-full md:w-1/3">
                  <div className={`px-6 py-2 rounded-xl font-black text-xs flex items-center gap-2 mb-1 ${
                    prop.recommendation === 'OVER' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                    prop.recommendation === 'UNDER' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                    'bg-slate-800 text-slate-500'
                  }`}>
                    {prop.recommendation === 'OVER' && <TrendingUp size={14} />}
                    {prop.recommendation === 'UNDER' && <TrendingDown size={14} />}
                    {prop.recommendation === 'PASS' && <Minus size={14} />}
                    {prop.recommendation}
                  </div>
                  <span className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter italic flex items-center gap-1">
                    Value Identified <ExternalLink size={8} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}