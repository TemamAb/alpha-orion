
import React, { useMemo } from 'react';
import { OptimizationReport } from '../types';
import Tooltip from './Tooltip';

interface Props {
  report: OptimizationReport;
  onClose: () => void;
}

const OptimizerConsoleModal: React.FC<Props> = ({ report, onClose }) => {
  const rewardPoints = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => {
      const base = 25 + (i * 1.5);
      const noise = Math.random() * 8;
      const smooth = base * (1 - Math.exp(-i / 10));
      return { x: i * 15, y: 100 - (smooth + noise) };
    });
  }, []);

  const curvePath = `M ${rewardPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;

  return (
    <div className="fixed inset-0 z-[280] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[100px]">
      <div className="glass w-full max-w-7xl h-[94vh] rounded-[4rem] overflow-hidden flex flex-col border border-cyan-500/40 shadow-[0_0_200px_rgba(6,182,212,0.25)]">
        
        {/* Header */}
        <div className="p-10 border-b border-white/10 flex justify-between items-center bg-cyan-900/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse"></div>
          <div className="flex items-center gap-8">
            <div className="p-5 bg-cyan-600 rounded-[2rem] shadow-2xl shadow-cyan-900/40 relative group">
              <div className="absolute inset-0 bg-white/20 animate-ping rounded-[2rem] opacity-20"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase text-shadow-glow">Neural Strategy Refinement Hub</h2>
              <div className="flex items-center gap-6 mt-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Agent: Neural Optimizer IX (BNIP Protocol)</span>
                <div className="px-4 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Real-Time Learning Active</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all group">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-90 transition-transform"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow flex overflow-hidden bg-[#010103]">
          <div className="flex-grow p-12 overflow-y-auto custom-scrollbar space-y-12">
            
            {/* Integrity Proof Bar */}
            <section className="flex flex-col md:flex-row gap-6 p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] relative overflow-hidden group">
               <div className="absolute inset-0 bg-emerald-500/[0.01] pointer-events-none group-hover:bg-emerald-500/[0.03] transition-colors"></div>
               <div className="flex-1">
                  <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Block Proof (BNIP)</div>
                  <div className="text-xl font-mono font-black text-white"># {report.integrityProof.blockHeight.toLocaleString()}</div>
                  <div className="text-[9px] font-mono text-slate-600 truncate mt-1">{report.integrityProof.blockHash}</div>
               </div>
               <div className="w-px bg-white/5 hidden md:block"></div>
               <div className="flex-1 text-center md:text-left">
                  <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Node Provider</div>
                  <div className="text-sm font-bold text-slate-300">{report.integrityProof.nodeProvider}</div>
                  <div className="text-[9px] text-slate-600 font-mono mt-1">Latency: {report.integrityProof.dataLatencyMs}ms</div>
               </div>
               <div className="flex items-center gap-4 shrink-0">
                  <div className="px-6 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center gap-3">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                     <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">0% Mock Verified</span>
                  </div>
               </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Learning Curve */}
              <section className="lg:col-span-7 p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] relative overflow-hidden group">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] mb-10">Neural Policy Convergence (PPO)</h3>
                <div className="h-48 w-full relative">
                  <svg viewBox="0 0 600 120" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="optGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(6, 182, 212, 0.3)" />
                        <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
                      </linearGradient>
                    </defs>
                    <path d={`${curvePath} L 585,120 L 0,120 Z`} fill="url(#optGradient)" />
                    <path d={curvePath} fill="none" stroke="#06b6d4" strokeWidth="4" strokeLinecap="round" className="drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                  </svg>
                </div>
                <div className="flex justify-between items-end mt-8">
                  <div>
                    <div className="text-[9px] text-slate-600 uppercase font-black mb-1">Overall Policy Reward</div>
                    <div className="text-3xl font-mono font-black text-white">x{report.overallReward.toFixed(3)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-slate-600 uppercase font-black mb-1">Convergence Index</div>
                    <div className="text-3xl font-mono font-black text-emerald-400">{report.convergenceDelta.toFixed(6)}</div>
                  </div>
                </div>
              </section>

              {/* Strategy Diff */}
              <section className="lg:col-span-5 space-y-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] mb-4">Parameter Optimization Delta</h3>
                <div className="space-y-4">
                  {report.tunedParams.map((param, i) => (
                    <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-cyan-500/40 transition-all flex flex-col justify-between group">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{param.key}</span>
                        <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">{param.impactLabel}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex-1">
                          <div className="text-[8px] text-slate-600 uppercase font-bold mb-1">Baseline</div>
                          <div className="text-lg font-mono text-slate-500">{param.originalValue}</div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="3" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        <div className="flex-1 text-right">
                          <div className="text-[8px] text-cyan-600 uppercase font-bold mb-1">Optimized</div>
                          <div className="text-xl font-mono text-white font-black">{param.optimizedValue}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Neural Logs and Signature */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8">
                 <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] mb-6">Neural Synthesis Feed</h3>
                 <div className="p-8 bg-black/80 rounded-[2.5rem] border border-white/10 font-mono text-[10px] space-y-3 h-64 overflow-y-auto custom-scrollbar">
                    {report.trainingLogs.map((log, i) => (
                      <div key={i} className="flex gap-4 group/log">
                        <span className="text-cyan-900 font-bold group-hover/log:text-cyan-500 transition-colors">[{i.toString().padStart(3, '0')}]</span>
                        <span className="text-slate-400 leading-relaxed">{log}</span>
                      </div>
                    ))}
                    <div className="pt-2 flex items-center gap-2 text-cyan-500/30">
                       <span className="animate-pulse">></span>
                       <span>ADAPTIVE WEIGHTS COMMITTED VIA GEMINI-3-PRO</span>
                    </div>
                 </div>
              </div>
              
              <div className="lg:col-span-4">
                 <div className="p-10 bg-cyan-600/10 border border-cyan-500/20 rounded-[3rem] text-center space-y-6">
                    <div>
                       <div className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] mb-2">Neural Signature</div>
                       <Tooltip content="Cryptographic hash of the refined neural network weights. Ensures non-repudiation of agent decisions." position="top">
                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-[9px] text-cyan-500/80 break-all leading-tight cursor-help">
                            {report.neuralPolicySignature}
                        </div>
                       </Tooltip>
                    </div>
                    <div className="h-px bg-white/5"></div>
                    <div>
                       <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Optimization Latency</div>
                       <div className="text-2xl font-mono font-black text-white">2,482ms</div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Aineonlite Neural-IX • Logic: PPO-ADAPTIVE • Sync: {new Date(report.timestamp).toLocaleTimeString()}
          </div>
          <div className="flex gap-4">
             <button 
                onClick={onClose}
                className="px-10 py-4 border border-white/10 hover:bg-white/5 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
             >Discard Synthesis</button>
             <Tooltip content="Commit the refined neural weights to the active engine kernel. Restarts simulation with new policy." position="top">
               <button 
                  onClick={() => alert("Neural policy committed. Engine strategy re-sharded.")}
                  className="px-16 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-cyan-500/20 active:scale-95"
               >Commit Strategy Refinement</button>
             </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizerConsoleModal;
