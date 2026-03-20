"use client";
import { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Minus, Activity, Hash, Zap, Settings2 } from 'lucide-react';

export default function PrizePicksDashboard() {
  const [rawData, setRawData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('POINTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [sensitivity, setSensitivity] = useState(1.8); // Higher sensitivity for bivariate
  const [threshold, setThreshold] = useState(4);    // Pro-level threshold

  useEffect(() => {
    async function initFetch() {
      setLoading(true);
      try {
        const res = await fetch('/api/props');
        const data = await res.json();
        setRawData(Array.isArray(data) ? data : []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    initFetch();
  }, []);

  const processedProps = useMemo(() => {
    return rawData.map(prop => {
      // Bivariate Logic: Offense strength * Defense weakness
      const composite = prop.offFactor * prop.defFactor;
      const tunedMultiplier = 1 + (composite - 1) * sensitivity;
      
      const projection = (prop.line * tunedMultiplier).toFixed(1);
      const edge = ((parseFloat(projection) / prop.line) - 1) * 100;
      
      let recommendation: 'OVER' | 'UNDER' | 'PASS' = 'PASS';
      if (edge > threshold) recommendation = 'OVER';
      else if (edge < -threshold) recommendation = 'UNDER';

      return { ...prop, projection, edge: edge.toFixed(1), recommendation };
    }).filter(p => 
      p.metric.includes(activeTab) && 
      p.player.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => Math.abs(parseFloat(b.edge)) - Math.abs(parseFloat(a.edge)));
  }, [rawData, sensitivity, threshold, activeTab, searchTerm]);

  return (
    <main className="min-h-screen bg-[#020202] text-slate-200 p-4 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <h1 className="text-6xl font-black text-white italic tracking-tighter">PP <span className="text-orange-600">PRO</span></h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
              <Zap size={12} className="text-orange-500 fill-orange-500" /> Bivariate Matchup Engine
            </p>
          </div>
          
          <div className="bg-slate-900/40 p-5 rounded-[2rem] border border-slate-800/50 backdrop-blur-xl w-full lg:w-80">
            <div className="flex items-center gap-2 text-orange-500 mb-4 font-black text-[10px] uppercase tracking-widest">
              <Settings2 size={14} /> Model Tuning
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase mb-2">Aggression <span>{sensitivity}x</span></div>
                <input type="range" min="1" max="3" step="0.1" value={sensitivity} onChange={(e) => setSensitivity(parseFloat(e.target.value))} className="w-full accent-orange-600 h-1 bg-slate-800 rounded-lg appearance-none" />
              </div>
              <div>
                <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase mb-2">Min Edge <span>{threshold}%</span></div>
                <input type="range" min="2" max="10" step="1" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} className="w-full accent-orange-600 h-1 bg-slate-800 rounded-lg appearance-none" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
           <div className="flex bg-slate-900/40 p-1.5 rounded-2xl border border-slate-800/50">
              {['POINTS', 'REBOUNDS', 'ASSISTS'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${activeTab === tab ? 'bg-orange-600 text-white' : 'text-slate-500'}`}>{tab}</button>
              ))}
           </div>
           <div className="relative flex-1">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
             <input placeholder="Search board..." className="w-full bg-slate-900/20 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-orange-500 outline-none" onChange={(e) => setSearchTerm(e.target.value)} />
           </div>
        </div>

        {loading ? (
          <div className="py-32 text-center animate-pulse text-slate-700 text-xs font-black uppercase tracking-[0.3em]">Syncing Bivariate Data...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {processedProps.map((prop, idx) => (
              <div key={`${prop.id}-${idx}`} className="bg-[#080808] border border-slate-800/40 p-8 rounded-[2.5rem] flex items-center justify-between group hover:border-orange-500/30 transition-all hover:bg-[#0c0c0c]">
                <div className="w-1/3">
                  <h3 className="font-black text-white text-2xl tracking-tight leading-none mb-2">{prop.player}</h3>
                  <p className="text-[10px] font-black text-orange-600 uppercase italic flex items-center gap-2">
                    {prop.team} <span className="text-slate-800 not-italic">vs</span> {prop.opponent}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-16 w-1/3 border-x border-slate-800/20">
                  <div className="text-center">
                    <p className="text-[8px] text-slate-600 uppercase font-black mb-2">PP Line</p>
                    <p className="text-3xl font-mono font-black text-slate-500">{prop.line}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] text-slate-600 uppercase font-black mb-2">Model</p>
                    <p className="text-3xl font-mono font-black text-white underline decoration-orange-600 decoration-4 underline-offset-[12px]">{prop.projection}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end w-1/3">
                  <div className={`px-10 py-4 rounded-[1.5rem] font-black text-sm flex items-center gap-3 shadow-2xl ${prop.recommendation === 'OVER' ? 'bg-green-600 text-white' : prop.recommendation === 'UNDER' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-600'}`}>
                    {prop.recommendation === 'OVER' && <TrendingUp size={20} />}
                    {prop.recommendation === 'UNDER' && <TrendingDown size={20} />}
                    {prop.recommendation} <span className="opacity-60 text-xs">({prop.edge}%)</span>
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