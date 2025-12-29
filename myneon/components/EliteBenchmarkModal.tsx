
import React from 'react';
import { EliteBenchmarkAnalysis } from '../types';
import Tooltip from './Tooltip';

interface Props {
  analysis: EliteBenchmarkAnalysis;
  onClose: () => void;
}

const EliteBenchmarkModal: React.FC<Props> = ({ analysis, onClose }) => {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/99 backdrop-blur-[120px]">
      <div className="glass w-full max-w-5xl h-[85vh] rounded-[4rem] overflow-hidden flex flex-col border border-cyan-500/40 shadow-[0_0_250px_rgba(34,211,238,0.2)] relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
        
        {/* Header */}
        <div className="p-12 text-center space-y-4">
           <div className="w-24 h-24 bg-cyan-600 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-[0_0_80px_rgba(34,211,238,0.6)] relative group">
              <div className="absolute inset-0 bg-white/20 animate-ping opacity-20"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
           </div>
           <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
              Elite <span className="text-cyan-400">Industry Ranking</span>
           </h1>
           <p className="text-[10px] text-cyan-500/60 font-black uppercase tracking-[0.8em]">AineonliteIX Competitive Auditor</p>
        </div>

        <div className="flex-grow overflow-y-auto p-12 custom-scrollbar bg-[#020205] space-y-16">
          {/* Grade & Rank */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <section className="p-10 bg-cyan-500/5 border border-cyan-500/20 rounded-[3rem] text-center relative group overflow-hidden">
                <div className="absolute inset-0 bg-cyan-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.4em] mb-8">Current Rank</h3>
                <div className="text-8xl font-black text-white tracking-tighter">#{analysis.ranking}</div>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-4">Global Elite Ranking</p>
             </section>

             <section className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] text-center">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-8">Performance Grade</h3>
                <div className="text-4xl font-black text-cyan-400 uppercase tracking-tighter mb-4">{analysis.grade}</div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden mt-8 border border-white/5">
                    <div className="h-full bg-cyan-500" style={{ width: `${analysis.competitiveScore}%` }}></div>
                </div>
                <div className="mt-4 flex justify-between text-[10px] font-mono text-slate-600">
                   <span>COMPETITIVE SCORE</span>
                   <span className="text-cyan-400">{analysis.competitiveScore}%</span>
                </div>
             </section>
          </div>

          {/* Comparison Matrix */}
          <section className="space-y-10">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-4">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_#22d3ee]"></span>
                Side-by-Side Competitive Analysis
             </h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-white/5">
                         <th className="pb-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Key Metric</th>
                         <th className="pb-6 text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">AineonliteIX</th>
                         <th className="pb-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Top Industry Avg</th>
                         <th className="pb-6 text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Advantage</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/[0.02]">
                      {analysis.industryMetrics.map((item, i) => (
                        <tr key={i} className="group hover:bg-white/[0.01] transition-colors">
                           <td className="py-8">
                              <span className="text-sm font-bold text-white uppercase tracking-tight">{item.metric}</span>
                           </td>
                           <td className="py-8">
                              <span className="text-xl font-mono font-black text-cyan-400">{item.aineonValue}</span>
                           </td>
                           <td className="py-8">
                              <span className="text-xl font-mono font-bold text-slate-500">{item.topCompetitorValue}</span>
                           </td>
                           <td className="py-8">
                              <div className="flex items-center gap-3">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="4"><path d="m18 15-6-6-6 6"/></svg>
                                 <span className="text-xl font-mono font-black text-emerald-400">+{item.advantagePercent}%</span>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </section>

          {/* Executive Summary */}
          <section className="p-12 bg-black rounded-[4rem] border border-white/10 relative overflow-hidden group">
             <div className="absolute inset-0 bg-cyan-500/[0.02] animate-pulse"></div>
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-6">Competitive Advantage Summary</h3>
             <p className="text-lg text-slate-300 font-light leading-relaxed italic relative z-10">
                "{analysis.executiveSummary}"
             </p>
          </section>
        </div>

        {/* Action Footer */}
        <div className="p-12 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Astra-Elite Audit Record • TS: {new Date(analysis.timestamp).getTime()}
          </div>
          <button 
            onClick={onClose}
            className="px-20 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.4em] transition-all shadow-[0_20px_60px_rgba(34,211,238,0.4)] active:scale-95"
          >
            Acknowledge Superiority
          </button>
        </div>
      </div>
    </div>
  );
};

export default EliteBenchmarkModal;
