
import React from 'react';
import { GlobalForgeReport } from '../types';

interface Props {
  report: GlobalForgeReport;
  onClose: () => void;
}

const EliteForgeModal: React.FC<Props> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[40px]">
      <div className="glass w-full max-w-7xl max-h-[96vh] rounded-[4rem] overflow-hidden flex flex-col border border-cyan-500/50 shadow-[0_0_200px_rgba(34,211,238,0.2)]">
        
        {/* Elite Header */}
        <div className="p-12 border-b border-white/10 flex justify-between items-center bg-cyan-600/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10 animate-pulse"></div>
          <div className="flex items-center gap-10 z-10">
            <div className="w-24 h-24 bg-cyan-600 rounded-[2rem] flex items-center justify-center shadow-[0_0_60px_rgba(34,211,238,0.5)] relative group">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 2v20"/><path d="m17 7-5-5-5 5"/><path d="m17 17-5 5-5-5"/></svg>
              <div className="absolute -inset-2 bg-cyan-400/20 blur-xl animate-pulse rounded-full"></div>
            </div>
            <div>
              <h2 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">
                Elite <span className="text-cyan-400">Global Forge</span>
              </h2>
              <div className="flex items-center gap-8">
                <span className="text-xs text-slate-500 font-mono uppercase tracking-[0.5em]">System Source: Architect Zero</span>
                <div className="px-4 py-1.5 bg-cyan-500/20 border border-cyan-500/40 rounded-full flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Benchmark: TOP 0.001% ACHIEVED</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-5 hover:bg-white/10 rounded-full transition-all text-slate-500 hover:text-white group z-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-180 transition-transform duration-700"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-12 overflow-y-auto custom-scrollbar bg-[#020203] flex-grow">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* Left: 0.001% Parameters */}
            <div className="lg:col-span-4 space-y-12">
              <section className="space-y-8">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-4">
                  <span className="w-10 h-[1px] bg-cyan-500/30"></span>
                  Elite Logic Parameters
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  {[
                    { label: 'Latency Baseline', val: `${report.eliteConfig.executionLatencyNs}ns`, color: 'text-cyan-400' },
                    { label: 'Gas Optimization', val: `${report.eliteConfig.gasEfficiencyPercent}%`, color: 'text-emerald-400' },
                    { label: 'MEV Protection', val: report.eliteConfig.mevProtectionLevel, color: 'text-purple-400' },
                    { label: 'Multi-Hop Tier', val: `Tier-${report.eliteConfig.multiHopComplexity}`, color: 'text-amber-400' },
                    { label: 'Formal Verification', val: report.eliteConfig.formalVerification ? 'ACTIVE' : 'BYPASSED', color: 'text-blue-400' }
                  ].map((param, i) => (
                    <div key={i} className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 hover:border-cyan-500/30 transition-all group">
                      <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">{param.label}</div>
                      <div className={`text-2xl font-mono font-black ${param.color} group-hover:scale-105 transition-transform`}>{param.val}</div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="p-10 bg-cyan-500/5 rounded-[3rem] border border-cyan-500/20 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-cyan-500/[0.02] animate-pulse"></div>
                 <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] mb-4">Elite Benchmark</h4>
                 <div className="text-5xl font-mono font-black text-white mb-2">{report.eliteConfig.benchmarkVsTop001.toFixed(3)}%</div>
                 <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Global Competitiveness Delta</p>
              </div>
            </div>

            {/* Right: Module Rebirth Stream */}
            <div className="lg:col-span-8 space-y-12">
              <section>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] mb-10 flex items-center gap-4">
                  <span className="w-10 h-[1px] bg-cyan-500/30"></span>
                  Engine Cluster Rebirth
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {report.moduleUpgrades.map((mod, i) => (
                    <div key={i} className="p-8 bg-cyan-500/[0.02] rounded-[2.5rem] border border-cyan-500/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between group">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="text-[10px] text-slate-600 font-mono mb-1 uppercase tracking-tighter">Module ID: {mod.id}</div>
                          <h4 className="font-black text-white text-xl uppercase tracking-tighter">{mod.newGrade} Integration</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-mono font-black text-cyan-400">+{mod.performanceDelta}%</div>
                          <div className="text-[8px] text-slate-700 uppercase font-black">Perf. Delta</div>
                        </div>
                      </div>
                      <div className="pt-6 border-t border-white/5">
                        <span className="text-[9px] font-bold text-cyan-500 uppercase tracking-[0.2em] block mb-2">Core Upgrade Injection</span>
                        <p className="text-xs text-slate-400 font-mono italic leading-relaxed">"{mod.keyUpgrade}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-black/60 rounded-[3rem] p-10 border border-white/10">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-8">Architect Logic Directives</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {report.logicDirectives.map((dir, i) => (
                     <div key={i} className="flex gap-4 items-start text-xs text-slate-400 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0 group-hover:animate-ping"></div>
                        <span className="leading-relaxed group-hover:text-white transition-colors">{dir}</span>
                     </div>
                   ))}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Global Forge Footer */}
        <div className="p-12 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <div className="text-[10px] text-slate-600 font-mono uppercase tracking-[0.3em]">
              Protocol: FORGE-CLUSTER-ZERO • Integrity: ABSOLUTE
            </div>
            <div className="text-[9px] text-slate-800 font-mono italic">
              Cycle Finished: {new Date(report.timestamp).toUTCString()}
            </div>
          </div>
          <div className="flex gap-6">
             <button 
              onClick={onClose}
              className="px-12 py-5 border border-white/10 hover:bg-white/5 text-slate-500 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all"
            >
              Discard Rebirth
            </button>
            <button 
              onClick={onClose}
              className="px-16 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_30px_70px_rgba(34,211,238,0.3)] hover:scale-[1.05] active:scale-95 flex items-center gap-4"
            >
              Commit Global Cluster Upgrade
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 5 5L20 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EliteForgeModal;
