
import React from 'react';
import { IronWallReport, Environment } from '../types';

interface Props {
  report: IronWallReport;
  onClose: () => void;
}

const IronWallConsoleModal: React.FC<Props> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 z-[290] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[100px]">
      <div className="glass w-full max-w-6xl h-[90vh] rounded-[4rem] overflow-hidden flex flex-col border border-slate-500/40 shadow-[0_0_200px_rgba(100,116,139,0.2)]">
        
        {/* Header */}
        <div className="p-10 border-b border-white/10 flex justify-between items-center bg-slate-900/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-500 to-transparent animate-pulse"></div>
          <div className="flex items-center gap-8">
            <div className="p-5 bg-slate-700 rounded-[2rem] shadow-2xl shadow-slate-900/40 relative group">
              <div className="absolute inset-0 bg-white/20 animate-ping rounded-[2rem] opacity-20"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="12" x2="12" y1="3" y2="21"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Iron Wall Guardian IX</h2>
              <div className="flex items-center gap-6 mt-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Silo Protocol: {report.activeBarrierProtocol}</span>
                <div className="px-4 py-1 bg-slate-500/10 rounded-full border border-slate-500/30 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${report.boundaryVerified ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    Boundary: {report.boundaryVerified ? 'VERIFIED' : 'UNSECURED'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all group">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-90 transition-transform"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow flex overflow-hidden bg-[#020205]">
          <div className="flex-grow p-12 overflow-y-auto custom-scrollbar space-y-12">
            
            {/* Top Row: Isolation Score & Protocol */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               <div className="p-8 bg-slate-900/40 border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center group overflow-hidden relative">
                  <div className="absolute inset-0 bg-slate-500/[0.02] group-hover:bg-slate-500/[0.05] transition-colors"></div>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Isolation Matrix</h3>
                  <div className="text-6xl font-mono font-black text-white mb-2">{report.isolationScore}%</div>
                  <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5 mt-4">
                     <div className="h-full bg-slate-500" style={{ width: `${report.isolationScore}%` }}></div>
                  </div>
               </div>

               <div className="md:col-span-2 p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6">Directory Siloing Map</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {report.directorySplits.map((split, i) => (
                       <div key={i} className={`p-5 rounded-2xl border flex items-center justify-between ${split.env === Environment.PRODUCTION ? 'bg-red-500/5 border-red-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
                          <div>
                             <div className="text-[8px] text-slate-600 font-black uppercase mb-1">{split.env} LAYER</div>
                             <div className="text-xs font-mono font-bold text-white">{split.folder}</div>
                             <div className="text-[10px] text-slate-500 font-mono mt-1 opacity-50">{split.path}</div>
                          </div>
                          <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${split.status === 'Strict-Lock' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                             {split.status}
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Boundary Visualizer */}
            <section className="p-10 bg-black/40 border border-white/5 rounded-[3rem] relative overflow-hidden group">
               <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-slate-500/50 to-transparent z-10"></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-slate-500/10 blur-3xl animate-pulse"></div>
               
               <div className="flex justify-between items-center relative z-20 h-40 px-20">
                  <div className="text-center space-y-4">
                     <div className="w-16 h-16 mx-auto bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M12 2v20"/><path d="M5 12h14"/></svg>
                     </div>
                     <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Simulation Cluster</span>
                  </div>
                  
                  <div className="text-center group-hover:scale-110 transition-transform duration-700">
                     <div className="p-4 bg-white/5 border border-white/10 rounded-3xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                     </div>
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-4 block">CRYPTO SILO</span>
                  </div>

                  <div className="text-center space-y-4">
                     <div className="w-16 h-16 mx-auto bg-red-600/20 border border-red-500/30 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                     </div>
                     <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block">Production Cluster</span>
                  </div>
               </div>
            </section>

            {/* Leakage Check List */}
            <section className="space-y-6">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-4">
                <span className="w-10 h-px bg-slate-500/30"></span>
                Topological Leakage Audit
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {report.leakageCheck.map((check, i) => (
                  <div key={i} className={`p-6 rounded-3xl border transition-all flex justify-between items-center group ${check.risk === 'Critical' ? 'bg-red-500/10 border-red-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                    <div className="flex items-center gap-10">
                       <div className="flex items-center gap-4">
                          <span className="text-xs font-mono font-bold text-white">{check.source}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="3"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                          <span className="text-xs font-mono font-bold text-slate-400">{check.target}</span>
                       </div>
                       <p className="text-[10px] text-slate-500 italic">"{check.detail}"</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${check.risk === 'Critical' ? 'bg-red-500 text-white border-red-500/50' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                      {check.risk === 'Critical' ? 'Leakage Risk' : 'Isolated'}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Specialist Rationale */}
            <section className="p-10 bg-slate-500/5 border border-slate-500/20 rounded-[3rem] relative group overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                  <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2v20"/><path d="M20 12l-8 8-8-8"/><path d="M20 5l-8 8-8-8"/></svg>
               </div>
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-6">Guardian Neural Synthesis</h3>
               <p className="text-lg text-slate-300 font-medium leading-relaxed italic max-w-4xl relative z-10">
                 "{report.guardianRationale}"
               </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Module: IRON-WALL-IX • Silo: STRICT-ENFORCE • Sync: {new Date(report.timestamp).toLocaleTimeString()}
          </div>
          <button 
            onClick={onClose}
            className="px-16 py-4 bg-slate-700 hover:bg-slate-600 text-white font-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-slate-900/20 hover:scale-[1.05] active:scale-95"
          >
            Acknowledge Isolation Silo
          </button>
        </div>
      </div>
    </div>
  );
};

export default IronWallConsoleModal;
