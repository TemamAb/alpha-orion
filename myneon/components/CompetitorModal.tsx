
import React from 'react';
import { LeaderboardReport } from '../types';
import Tooltip from './Tooltip';

interface Props {
  report: LeaderboardReport;
  onClose: () => void;
}

const CompetitorModal: React.FC<Props> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/99 backdrop-blur-[120px]">
      <div className="glass w-full max-w-5xl h-[85vh] rounded-[4rem] overflow-hidden flex flex-col border border-blue-500/40 shadow-[0_0_250px_rgba(34,211,238,0.2)] relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
        
        {/* Header */}
        <div className="p-12 text-center space-y-4">
           <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-[0_0_80px_rgba(34,211,238,0.6)] relative group">
              <div className="absolute inset-0 bg-white/20 animate-ping opacity-20"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
           </div>
           <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
              Elite <span className="text-blue-400">Industry Leaderboard</span>
           </h1>
           <p className="text-[10px] text-blue-500/60 font-black uppercase tracking-[0.8em]">AineonliteIX Competitive Pulse</p>
        </div>

        <div className="flex-grow overflow-y-auto p-12 custom-scrollbar bg-[#020205] space-y-16">
          {/* Global Stats Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <section className="p-10 bg-blue-500/5 border border-blue-500/20 rounded-[3rem] text-center relative group overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.4em] mb-8">Global Elite Score</h3>
                <div className="text-8xl font-black text-white tracking-tighter">{report.globalEliteScore.toFixed(1)}</div>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-4">Weighted Market Readiness</p>
             </section>

             <section className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] text-center">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-8">Dominance Index</h3>
                <div className="text-6xl font-black text-emerald-400 tracking-tighter mb-4">{report.marketDominancePercent}%</div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden mt-8 border border-white/5">
                    <div className="h-full bg-emerald-500" style={{ width: `${report.marketDominancePercent}%` }}></div>
                </div>
                <div className="mt-4 text-[10px] font-mono text-slate-600 uppercase tracking-widest">Target Dominance: 25.0%</div>
             </section>
          </div>

          {/* Leaderboard Table */}
          <section className="space-y-10">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-4">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></span>
                Top 3 Elite Grade Competitors
             </h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-white/5">
                         <th className="pb-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Rank</th>
                         <th className="pb-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Platform</th>
                         <th className="pb-6 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Latency</th>
                         <th className="pb-6 text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">MEV Deflect</th>
                         <th className="pb-6 text-[10px] font-black text-purple-500 uppercase tracking-[0.2em]">Atomics</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/[0.02]">
                      {report.leaderboard.map((item, i) => (
                        <tr key={i} className={`group transition-colors ${item.isAineon ? 'bg-blue-500/[0.03]' : 'hover:bg-white/[0.01]'}`}>
                           <td className="py-8">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black border ${
                                i === 0 ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]' :
                                i === 1 ? 'bg-slate-300 border-slate-200 text-black' :
                                i === 2 ? 'bg-orange-700 border-orange-600 text-white' :
                                'bg-black border-white/10 text-slate-500'
                              }`}>
                                #{item.rank}
                              </div>
                           </td>
                           <td className="py-8">
                              <div className="space-y-1">
                                 <div className={`text-sm font-black uppercase tracking-tight ${item.isAineon ? 'text-blue-400' : 'text-white'}`}>
                                   {item.name}
                                   {item.isAineon && <span className="ml-3 px-2 py-0.5 bg-blue-600 text-white text-[8px] rounded-full tracking-widest">YOU</span>}
                                 </div>
                                 <div className="text-[10px] text-slate-600 italic truncate max-w-[250px]">{item.notes}</div>
                              </div>
                           </td>
                           <td className="py-8">
                              <span className="text-xl font-mono font-black text-blue-400">{item.latencyMs}ms</span>
                           </td>
                           <td className="py-8">
                              <span className="text-xl font-mono font-black text-emerald-400">{item.mevDeflection}%</span>
                           </td>
                           <td className="py-8">
                              <span className="text-xl font-mono font-black text-purple-400">{item.atomicSuccessRate}%</span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </section>

          {/* Gap Analysis Summary */}
          <section className="p-12 bg-black rounded-[4rem] border border-white/10 relative overflow-hidden group">
             <div className="absolute inset-0 bg-blue-500/[0.02] animate-pulse"></div>
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-6">Competitive Intelligence Synthesis</h3>
             <p className="text-lg text-slate-300 font-light leading-relaxed italic relative z-10">
                "{report.competitiveGapAnalysis}"
             </p>
          </section>
        </div>

        {/* Action Footer */}
        <div className="p-12 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Audit TS: {new Date(report.timestamp).getTime()} • Source: Global Industry Feed
          </div>
          <button 
            onClick={onClose}
            className="px-20 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.4em] transition-all shadow-[0_20px_60px_rgba(34,211,238,0.4)] active:scale-95"
          >
            Acknowledge Position
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompetitorModal;
