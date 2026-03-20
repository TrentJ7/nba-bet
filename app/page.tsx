"use client";
import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Minus, Trophy, Activity } from 'lucide-react';
import { PropPrediction } from '@/lib/types';

export default function NBADashboard() {
  const [props, setProps] = useState<PropPrediction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch data whenever searchTerm changes (with a slight delay/debounce)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/props?search=${searchTerm}`);
        const data = await res.json();
        setProps(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce to save API calls while typing

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <main className="min-h-screen bg-[#050505] text-slate-200 p-4 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="text-orange-500" size={20} />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">PropEdge Analytics</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter italic">DAILY BOARD</h1>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Search Player..."
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-white placeholder:text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {/* Prediction Feed */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-50">
            <Activity className="animate-spin text-orange-500 mb-4" size={32} />
            <p className="font-mono text-xs uppercase tracking-widest">Recalculating Edges...</p>
          </div>
        ) : props.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-slate-800 rounded-3xl">
            <p className="text-slate-600 uppercase font-bold tracking-widest">No Probable Value Found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {props.map((prop) => (
              <div 
                key={prop.id} 
                className="bg-[#0f0f0f] border border-slate-800/50 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between hover:bg-[#151515] transition-colors group"
              >
                {/* Player & Metric Info */}
                <div className="flex items-center gap-6 w-full md:w-1/3">
                  <div className="hidden md:block w-12 h-12 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                        {prop.metric.replace('player_', '').toUpperCase()}
                      </span>
                      <span className="text-[10px] font-bold text-orange-500 uppercase">{prop.team}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">{prop.player}</h3>
                  </div>
                </div>

                {/* The Line vs Projection */}
                <div className="flex items-center justify-center gap-12 py-6 md:py-0 w-full md:w-1/3 border-y md:border-y-0 md:border-x border-slate-800/50 my-4 md:my-0">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Bookie Line</p>
                    <p className="text-2xl font-mono font-bold text-slate-300">{prop.line}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Model Proj</p>
                    <p className="text-2xl font-mono font-bold text-white underline decoration-orange-500/50 underline-offset-4">{prop.projection}</p>
                  </div>
                </div>

                {/* Recommendation & Edge */}
                <div className="flex flex-col items-center md:items-end w-full md:w-1/4">
                  <div className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-sm mb-2 ${
                    prop.recommendation === 'OVER' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                    prop.recommendation === 'UNDER' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                    'bg-slate-800 text-slate-500'
                  }`}>
                    {prop.recommendation === 'OVER' && <TrendingUp size={16} />}
                    {prop.recommendation === 'UNDER' && <TrendingDown size={16} />}
                    {prop.recommendation === 'PASS' && <Minus size={16} />}
                    {prop.recommendation}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">Probable Edge:</span>
                    <span className="text-xs font-mono font-bold text-slate-300">{prop.edge}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}