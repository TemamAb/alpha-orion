
import React from 'react';
import { IntelligenceMissionReport } from '../types';
import Tooltip from './Tooltip';

interface Props {
  report: IntelligenceMissionReport;
  onClose: () => void;
}

const IntelligenceMissionModal: React.FC<Props> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[150px]">
      <div className="glass w-full max-w-6xl max-h-[92vh] rounded-[4rem] overflow-hidden flex flex-col border border-red-500/30 shadow-[0_0_200px_rgba(239,68,68,0.15)] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>
        
        {/* Stealth Header */}
        <div className="p-12 border-b border-white/10 flex justify-between items-center bg-red-900/10">
          <div className="flex items-center gap-10">
            <div className="w-24 h-24 bg-red-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-red-500/40 relative group overflow-hidden">
               <div className="absolute inset-0 bg-white/10 animate-ping rounded-[2rem] opacity-20"></div>
               <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 2v20"/><path d="M2 12h20"/><path d="m19 19-7-7 7-7"/><path d="m5 19 7-7-7-7"/></svg>
            </div>
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Intelligence Mission Hub</h2>
              <div className="flex items-center gap-6 mt-3">
                <span className="text-[11px] text-slate-500 uppercase font-black tracking-[0.4em]">Target: Elite Competitor Reverse Engineering</span>
                <div className={`px-4 py-1 rounded-full border flex items-center gap-2 ${report.threatLevel === 'Critical' ? 'bg-red-500/20 border-red-500/40 text-red-500' : 'bg-amber-500/20 border-amber-500/40 text-amber-500'}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Threat Level: {report.threatLevel}</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all group">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-90 transition-transform"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-12 custom-scrollbar bg-[#020205] space-y-16">
          
          {/* Summary Analysis */}
          <section className="text-center max-w-4xl mx-auto space-y-10">
             <div className="p-10 bg-red-500/5 border border-red-500/20 rounded-[3rem] text-slate-300 italic text-2xl font-light leading-relaxed relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                </div>
                "{report.aineonBenefitAnalysis}"
             </div>
             <div className="flex justify-center gap-12">
                <div>
                   <div className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] mb-2">Scan Depth</div>
                   <div className="text-4xl font-mono font-black text-white">{report.scanDepth}%</div>
                </div>
                <div className="w-px h-12 bg-white/10"></div>
                <div>
                   <div className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] mb-2">Target Cluster</div>
                   <div className="flex gap-3">
                      {report.targetEngines.map(e => (
                        <span key={e} className="text-[10px] font-black text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">{e}</span>
                      ))}
                   </div>
                </div>
             </div>
          </section>

          {/* Discovered Modules Matrix */}
          <section className="space-y-10">
             <div className="flex items-center justify-between px-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-4">
                   <span className="w-10 h-px bg-red-500/30"></span>
                   Competitor Feature dissection
                </h3>
                <div className="text-[8px] font-mono text-slate-700 uppercase tracking-[0.2em]">Intel Harvest v4.2</div>
             </div>
             
             <div className="grid grid-cols-1 gap-8">
                {report.discoveredModules.map((mod, i) => (
                  <div key={i} className={`p-8 rounded-[2.5rem] border transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 ${mod.isAineonMissing ? 'bg-red-500/5 border-red-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                    <div className="flex-grow space-y-6">
                       <div className="flex items-center gap-4">
                          <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{mod.name}</h4>
                          {mod.isAineonMissing && (
                             <span className="px-3 py-1 bg-red-600 text-white text-[8px] font-black rounded-full tracking-[0.2em] animate-pulse">AION GAP DETECTED</span>
                          )}
                       </div>
                       <p className="text-sm text-slate-400 font-medium leading-relaxed italic">"{mod.advantage}"</p>
                       <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                          <span className="text-[9px] font-black text-red-500 uppercase tracking-widest block mb-2">Technical Extraction</span>
                          <p className="text-xs font-mono text-slate-300 leading-relaxed">{mod.technicalDetails}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-10 shrink-0 p-6 bg-black/40 border border-white/5 rounded-3xl">
                       <div className="text-center px-4">
                          <div className="text-[9px] font-black text-slate-700 uppercase mb-2">Complexity</div>
                          <div className="text-3xl font-mono font-black text-white">{mod.complexityScore}</div>
                       </div>
                       <div className="w-px h-10 bg-white/5"></div>
                       <Tooltip content="Trigger an immediate engineering forge cycle to replicate and harden this feature for AION.">
                          <button className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-500/20 active:scale-95">
                             Initialize Replication
                          </button>
                       </Tooltip>
                    </div>
                  </div>
                ))}
             </div>
          </section>

          {/* Module Injection Recommendations */}
          <section className="p-12 bg-white/[0.02] border border-white/5 rounded-[4rem] relative overflow-hidden group">
             <div className="absolute inset-0 bg-red-500/[0.02] animate-pulse"></div>
             <div className="flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
                <div className="space-y-4 flex-1">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Critical Cluster Injections</h3>
                   <div className="flex flex-wrap gap-4">
                      {report.suggestedModuleInjections.map(inj => (
                         <div key={inj} className="px-6 py-3 bg-red-600/10 border border-red-500/40 rounded-2xl flex items-center gap-4 group/inj hover:bg-red-600/20 transition-all cursor-help">
                            <div className="w-2 h-2 rounded-full bg-red-500 group-hover/inj:animate-ping"></div>
                            <span className="text-xs font-black text-red-400 uppercase tracking-widest">{inj}</span>
                         </div>
                      ))}
                   </div>
                </div>
                <div className="text-right shrink-0">
                   <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Mission Result</div>
                   <div className="text-2xl font-black text-emerald-400 uppercase tracking-widest">SOVEREIGNTY PATH CLEAR</div>
                </div>
             </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-12 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[11px] text-slate-600 font-mono uppercase tracking-[0.3em]">
            AION V IX Intelligence Hub • Top 3 Dissected • Handshake Secure
          </div>
          <button 
            onClick={onClose}
            className="px-20 py-5 bg-red-600 hover:bg-red-500 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.4em] transition-all shadow-[0_20px_60px_rgba(239,68,68,0.3)] hover:scale-[1.05] active:scale-95 flex items-center gap-4 group"
          >
            Acknowledge Intelligence
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform"><path d="m5 12 5 5L20 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceMissionModal;
