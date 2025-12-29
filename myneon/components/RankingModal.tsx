
import React from 'react';
import { RankingReport } from '../types';
import Tooltip from './Tooltip';

interface Props {
  report: RankingReport;
  onClose: () => void;
}

const RankingModal: React.FC<Props> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[120px]">
      <div className="glass w-full max-w-7xl max-h-[92vh] rounded-[4rem] overflow-hidden flex flex-col border border-blue-500/40 shadow-[0_0_150px_rgba(6,182,212,0.2)]">
        
        {/* Dominance Header */}
        <div className="p-12 border-b border-white/10 flex justify-between items-center bg-blue-900/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-pulse"></div>
          <div className="flex items-center gap-10">
            <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-500/40 relative group overflow-hidden">
               <div className="absolute inset-0 bg-white/10 animate-ping rounded-[2rem] opacity-20"></div>
               <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            </div>
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Trinity Dominance HUD</h2>
              <div className="flex items-center gap-6 mt-3">
                <span className="text-[11px] text-slate-500 uppercase font-black tracking-[0.4em]">Rank Discovery: Adaptive Industry Sync</span>
                <div className={`px-4 py-1 rounded-full border flex items-center gap-2 ${report.status === 'Dominant' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-amber-500/10 border-amber-500/40 text-amber-400'}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">AION Status: {report.status}</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all group">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-90 transition-transform"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-12 custom-scrollbar bg-[#020205] space-y-16">
          
          {/* Explainability Synthesis */}
          <section className="text-center max-w-4xl mx-auto space-y-10">
             <div className="p-10 bg-blue-500/5 border border-blue-500/20 rounded-[3rem] text-slate-300 italic text-2xl font-light leading-relaxed relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M2 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                "{report.evidence.explainabilityLog}"
             </div>
             <div className="flex justify-center gap-12">
                <div>
                   <div className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] mb-2">Dominance Ratio</div>
                   <div className="text-4xl font-mono font-black text-white">x{report.evidence.dominanceRatio.toFixed(2)}</div>
                </div>
                <div className="w-px h-12 bg-white/10"></div>
                <div>
                   <div className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] mb-2">Victories (L100)</div>
                   <div className="text-4xl font-mono font-black text-emerald-400">{report.evidence.victoryCount}/100</div>
                </div>
                <div className="w-px h-12 bg-white/10"></div>
                <div>
                   <div className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] mb-2">Leader Offset</div>
                   <div className="text-4xl font-mono font-black text-blue-400">{report.evidence.comparativeLatencyDelta}ns</div>
                </div>
             </div>
          </section>

          {/* Trinity Matrix Table */}
          <section className="space-y-10">
             <div className="flex items-center justify-between px-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-4">
                   <span className="w-10 h-px bg-blue-500/30"></span>
                   Trinity Comparison: World Top 3
                </h3>
                <div className="text-[8px] font-mono text-slate-700 uppercase tracking-[0.2em]">Verified Blockchain Trace Hub</div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {report.topThree.map((engine, i) => (
                  <div key={engine.name} className={`p-10 rounded-[3.5rem] border transition-all relative overflow-hidden group ${i === 0 ? 'bg-blue-600/10 border-blue-500/40 shadow-2xl' : 'bg-white/[0.02] border-white/5'}`}>
                    {i === 0 && <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500 animate-pulse"></div>}
                    <div className="flex justify-between items-start mb-12">
                       <div>
                          <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${i === 0 ? 'text-blue-400' : 'text-slate-600'}`}>Rank #{i + 1}</div>
                          <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{engine.name}</h4>
                       </div>
                       <Tooltip content="External traceable block-hash confirming these metrics.">
                          <div className="w-10 h-10 bg-black/40 rounded-xl flex items-center justify-center border border-white/10 cursor-help group-hover:border-blue-400/50 transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                          </div>
                       </Tooltip>
                    </div>

                    <div className="space-y-8">
                       <div className="flex justify-between items-end">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Execution Latency</span>
                          <span className="text-xl font-mono font-black text-white">{engine.latencyNs}ns</span>
                       </div>
                       <div className="flex justify-between items-end">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Atomic Success</span>
                          <span className="text-xl font-mono font-black text-emerald-400">{engine.atomicSuccess}%</span>
                       </div>
                       <div className="flex justify-between items-end">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Market Share</span>
                          <span className="text-xl font-mono font-black text-blue-400">{engine.blockShare}%</span>
                       </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5">
                       <div className="text-[8px] font-mono text-slate-800 break-all leading-tight">TRACE: {engine.lastTraceHash}</div>
                    </div>
                  </div>
                ))}
             </div>
          </section>

          {/* Verification Protocol */}
          <div className="p-12 bg-black rounded-[4rem] border border-white/10 flex flex-col md:flex-row justify-between items-center gap-12 relative overflow-hidden group">
             <div className="absolute inset-0 bg-blue-500/[0.01] pointer-events-none animate-pulse"></div>
             <div className="flex-1 space-y-4">
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] block">Adaptive Dominance Proof</span>
                <div className="text-xs font-mono text-blue-400/60 bg-blue-500/5 p-6 rounded-3xl border border-blue-500/20 break-all leading-relaxed shadow-inner">
                   {report.blockchainProofHash}
                </div>
             </div>
             <div className="shrink-0 text-right">
                <div className="text-[10px] font-black text-slate-700 uppercase mb-2">Audit Timestamp</div>
                <div className="text-2xl font-black text-emerald-400 uppercase tracking-widest">{new Date(report.timestamp).toLocaleTimeString()}</div>
                <div className="text-[8px] text-slate-800 font-mono mt-2 uppercase tracking-[0.2em]">Verified via L1 Shadow-Stream</div>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-12 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[11px] text-slate-600 font-mono uppercase tracking-[0.3em]">
            AION V IX Arbiter • Dynamic Ranking Active • Proof-of-Dominance Established
          </div>
          <button 
            onClick={onClose}
            className="px-20 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.4em] transition-all shadow-[0_20px_60px_rgba(6,182,212,0.3)] hover:scale-[1.05] active:scale-95 flex items-center gap-4 group"
          >
            Acknowledge Trinity Proof
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform"><path d="m5 12 5 5L20 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RankingModal;
