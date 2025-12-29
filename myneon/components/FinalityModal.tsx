
import React from 'react';
import { FinalityReport } from '../types';
import Tooltip from './Tooltip';

interface Props {
  report: FinalityReport;
  onClose: () => void;
}

const FinalityModal: React.FC<Props> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 z-[450] flex items-center justify-center p-4 bg-black/99 backdrop-blur-[120px]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-amber-600/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="glass w-full max-w-5xl h-[85vh] rounded-[5rem] overflow-hidden flex flex-col border border-amber-500/50 shadow-[0_0_250px_rgba(245,158,11,0.2)] relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-pulse"></div>
        
        {/* Holographic Header */}
        <div className="p-16 text-center space-y-4">
           <div className="w-24 h-24 bg-amber-600 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-[0_0_80px_rgba(245,158,11,0.6)] relative group overflow-hidden">
              <div className="absolute inset-0 bg-white/20 animate-ping opacity-20"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
           </div>
           <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
              Aineonlite<span className="text-blue-500">IX</span> <span className="text-amber-500">Finality Seal</span>
           </h1>
           <p className="text-[10px] text-amber-500/60 font-black uppercase tracking-[0.8em]">Aineonlite<span className="text-blue-500">IX</span> Release Certified</p>
        </div>

        <div className="flex-grow overflow-y-auto p-12 custom-scrollbar bg-[#020205] space-y-12">
          {/* Arbiter Rationale */}
          <section className="text-center max-w-3xl mx-auto">
             <div className="p-10 bg-amber-500/5 border border-amber-500/20 rounded-[3rem] text-slate-300 italic text-2xl font-light leading-relaxed">
                "{report.arbiterRationale}"
             </div>
          </section>

          {/* Checklist Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {report.integrityChecklist.map((item, i) => (
              <Tooltip key={i} content={`Protocol validation check: ${item.detail}`} position="top">
                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] group hover:border-amber-500/30 transition-all cursor-help h-full">
                  <div className="flex justify-between items-center mb-4">
                     <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                       item.status === 'PASS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                     }`}>
                       {item.status}
                     </div>
                     <div className="text-[8px] text-slate-700 font-mono">IX-V{i+1}</div>
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">{item.label}</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed italic">"{item.detail}"</p>
                </div>
              </Tooltip>
            ))}
          </div>

          {/* Release Genesis Block */}
          <section className="p-12 bg-black rounded-[4rem] border border-white/10 relative overflow-hidden group">
             <div className="absolute inset-0 bg-amber-500/[0.02] animate-pulse"></div>
             <div className="flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
                <div className="space-y-2 flex-1">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Release Genesis Hash</h3>
                   <Tooltip content="Unique SHA-256 fingerprint representing the finalized state of the cluster." position="top">
                     <div className="text-xs font-mono text-amber-500 break-all bg-amber-500/5 p-6 rounded-3xl border border-amber-500/20 cursor-copy">
                       {report.genesisHash}
                     </div>
                   </Tooltip>
                </div>
                <div className="text-right shrink-0">
                   <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Verified Grade</div>
                   <div className="text-5xl font-mono font-black text-white">{report.gradeVerified}</div>
                   <div className="text-[8px] text-slate-700 uppercase font-black tracking-widest mt-2">Certified by The Arbiter IX</div>
                </div>
             </div>
          </section>
        </div>

        {/* Action Footer */}
        <div className="p-12 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            ENGINE SIGNATURE: {report.engineSignature} • TS: {new Date(report.timestamp).getTime()}
          </div>
          <Tooltip content="Officially authorize the Sovereign Release and begin mainnet settlement procedures.">
            <button 
              onClick={onClose}
              className="px-20 py-5 bg-amber-600 hover:bg-amber-500 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.4em] transition-all shadow-[0_20px_60px_rgba(245,158,11,0.4)] active:scale-95"
            >
              Acknowledge Sovereign Release
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default FinalityModal;
