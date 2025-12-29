
import React from 'react';
import { TotalUpgradeReport } from '../types';

interface Props {
  report: TotalUpgradeReport;
  onClose: () => void;
}

const TotalUpgradeModal: React.FC<Props> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl">
      <div className="glass w-full max-w-6xl max-h-[94vh] rounded-[3rem] overflow-hidden flex flex-col border border-blue-500/50 shadow-[0_0_150px_rgba(59,130,246,0.2)]">
        {/* Animated Header */}
        <div className="p-10 border-b border-white/10 flex justify-between items-center bg-blue-600/5 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse"></div>
          <div className="flex items-center gap-8">
            <div className="p-5 bg-blue-600 rounded-[1.5rem] shadow-2xl shadow-blue-500/40 relative group">
              <div className="absolute inset-0 bg-white/20 animate-ping rounded-[1.5rem] opacity-20"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
                Engine Rebirth <span className="text-blue-500">Delivered</span>
              </h2>
              <div className="flex items-center gap-6">
                <span className="text-xs text-slate-500 font-mono uppercase tracking-[0.3em]">Module Cluster: IX-PRO-UPGRADE</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Upgrade Verified</span>
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-white/10 rounded-full transition-all text-slate-500 hover:text-white group">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-10 overflow-y-auto custom-scrollbar bg-[#050507] flex-grow">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left: Gaps & Analysis */}
            <div className="lg:col-span-4 space-y-10">
              <section>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                  Detected Logic Gaps
                </h3>
                <div className="space-y-4">
                  {report.gapsIdentified.map((gap, i) => (
                    <div key={i} className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 hover:border-red-500/20 transition-all group">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{gap.category}</span>
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${
                          gap.impact === 'Critical' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-orange-500/20 text-orange-500 border border-orange-500/30'
                        }`}>
                          {gap.impact}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed group-hover:text-white transition-colors">{gap.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="p-8 bg-blue-500/5 rounded-3xl border border-blue-500/20">
                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4">Specialist Summary</h3>
                <p className="text-sm text-slate-400 leading-relaxed italic">"{report.executiveSummary}"</p>
              </section>
            </div>

            {/* Right: Rebirth Results */}
            <div className="lg:col-span-8 space-y-10">
              <section>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                  Upgraded Module Logic
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {report.upgradedModules.map((mod, i) => (
                    <div key={i} className="p-6 bg-emerald-500/[0.02] rounded-3xl border border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-white text-base mb-1">{mod.name}</h4>
                          <span className="text-[8px] text-slate-600 uppercase font-bold tracking-widest">Base: {mod.oldStatus}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-mono font-black text-emerald-400">+{mod.improvementScore}%</div>
                          <div className="text-[8px] text-slate-700 uppercase font-black">Optimization Delta</div>
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        {mod.newFeatures.map((feat, fi) => (
                          <div key={fi} className="flex items-center gap-2 text-[10px] text-emerald-500/70 font-mono">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                            {feat}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="p-8 bg-white/[0.02] rounded-3xl border border-white/5">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6">New Directory Schema</h3>
                <div className="p-6 bg-black rounded-2xl border border-white/5 font-mono text-xs text-blue-400/80 max-h-48 overflow-y-auto custom-scrollbar">
                   <pre>{JSON.stringify(report.reorganizationPlan.root, null, 2)}</pre>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Upgrade Cycle: 0xFF-PRO-ELITE • Timestamp: {new Date(report.deliveryTimestamp).toLocaleTimeString()}
          </div>
          <div className="flex gap-4">
             <button 
              onClick={onClose}
              className="px-10 py-4 border border-white/10 hover:bg-white/5 text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Discard Changes
            </button>
            <button 
              onClick={onClose}
              className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:scale-[1.05] active:scale-95"
            >
              Apply Global Upgrade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalUpgradeModal;
