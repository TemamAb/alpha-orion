import React from 'react';
import { InvestigationReport } from '../types';

interface Props {
  report: InvestigationReport;
  onClose: () => void;
}

const InvestigationModal: React.FC<Props> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-black/95 backdrop-blur-[60px]">
      <div className="glass w-full max-w-6xl max-h-[92vh] rounded-[3rem] overflow-hidden flex flex-col border border-blue-500/40 shadow-[0_0_150px_rgba(59,130,246,0.2)]">
        {/* Header */}
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-blue-500/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-pulse"></div>
          <div className="flex items-center gap-6">
            <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">
                IX-DEEP INVESTIGATION: <span className="text-blue-400 font-mono">{report.target}</span>
              </h2>
              <div className="flex items-center gap-6 mt-1">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Specialist Unit: Investigator Elite-IX</span>
                <div className={`px-3 py-0.5 rounded-full border text-[10px] font-black uppercase ${report.securityScore >= 90 ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/50 text-amber-400 bg-amber-500/10'}`}>
                  Security Score: {report.securityScore}%
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-10 bg-[#020204] custom-scrollbar space-y-12">
          {/* Top Row: Findings & Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8">
              <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Executive Finding Synthesis
              </h3>
              <div className="p-8 bg-blue-500/5 rounded-[2.5rem] border border-blue-500/20 text-slate-300 italic leading-relaxed text-xl font-light">
                "{report.findings}"
              </div>
            </div>
            <div className="lg:col-span-4 bg-black/40 rounded-[2.5rem] border border-white/10 p-8 flex flex-col">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><path d="M14 2v6h6"/><path d="m3 15 2 2 4-4"/></svg>
                Real-Time Analysis Stream
              </h3>
              <div className="flex-grow space-y-2 font-mono text-[10px] custom-scrollbar">
                {report.deepScanLogs.map((log, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-blue-900">{(i+1).toString().padStart(2, '0')}</span>
                    <span className="text-blue-300/60 leading-relaxed">{log}</span>
                  </div>
                ))}
                <div className="pt-2 flex items-center gap-2 text-blue-500/20">
                  <span className="animate-pulse">_</span>
                  <span>SCANNING COMPLETE...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Adversarial Simulation & Formal Verification */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
             <section>
               <h3 className="text-xs font-black text-red-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                 Adversarial Attack Simulation
               </h3>
               <div className="space-y-4">
                 {report.attackSimulations.map((sim, i) => (
                   <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-red-500/20 transition-all">
                     <div className="flex justify-between items-center mb-3">
                       <span className="text-sm font-bold text-white uppercase tracking-tight">{sim.vector}</span>
                       <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                         sim.outcome === 'Deflected' ? 'bg-emerald-500 text-white' : 
                         sim.outcome === 'Exploited' ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-500 text-white'
                       }`}>
                         {sim.outcome}
                       </span>
                     </div>
                     <p className="text-xs text-slate-500 leading-relaxed italic">"{sim.notes}"</p>
                   </div>
                 ))}
               </div>
             </section>

             <section>
               <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                 Formal Invariant Verification
               </h3>
               <div className="space-y-4">
                 {report.formalInvariants.map((inv, i) => (
                   <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-emerald-500/20 transition-all flex justify-between items-center">
                     <div>
                       <div className="text-xs font-mono font-bold text-emerald-400 uppercase mb-1">{inv.invariant}</div>
                       <div className="text-[9px] text-slate-600 uppercase font-black">Method: {inv.proofMethod}</div>
                     </div>
                     <div className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase ${
                       inv.status === 'Proven' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 
                       inv.status === 'Violation' ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-slate-500/30 text-slate-400'
                     }`}>
                       {inv.status}
                     </div>
                   </div>
                 ))}
               </div>
             </section>
          </div>

          {/* Vulnerabilities & Optimizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <section>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-6">Security Audit Exceptions</h3>
              <div className="space-y-4">
                {report.vulnerabilities.map((v, i) => (
                  <div key={i} className={`p-6 rounded-[2rem] border transition-all ${
                    v.severity === 'High' ? 'bg-red-500/5 border-red-500/20' : 'bg-white/[0.02] border-white/5'
                  }`}>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">{v.issue}</h4>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${
                        v.severity === 'High' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                      }`}>
                        {v.severity} Severity
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">{v.description}</p>
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                       <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block mb-1">Remediation Path</span>
                       <p className="text-[10px] text-slate-300 font-mono italic leading-relaxed">{v.remediation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-6">Bytecode & Logic Optimizations</h3>
              <div className="space-y-4">
                {report.optimizations.map((opt, i) => (
                  <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:border-blue-500/30 transition-all flex flex-col justify-between h-fit">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{opt.type} Enhancement</span>
                       <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${opt.impact === 'High' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                         {opt.impact} Impact
                       </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed italic">"{opt.improvement}"</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Logic Flow Mapping */}
          <section className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] relative overflow-hidden group">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping"></span>
              Autonomous Logic Mapping
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-10 py-10 relative">
              <div className="absolute inset-0 bg-purple-500/[0.01] pointer-events-none"></div>
              {report.logicFlows.map((flow, i) => (
                <React.Fragment key={i}>
                  <div className="relative group/node">
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[1.5rem] blur opacity-20 group-hover/node:opacity-50 transition duration-1000"></div>
                    <div className="relative px-8 py-5 bg-[#0a0a0c] border border-white/10 rounded-[1.5rem] text-xs font-mono font-black text-white uppercase tracking-widest shadow-2xl transition-all group-hover/node:-translate-y-1">
                      {/* Fix: logicFlows is an object array, so we must render specific properties instead of the object itself */}
                      <div className="text-center">
                        <div className="text-[8px] text-slate-500 mb-1">{flow.source} ➔ {flow.target}</div>
                        <div>{flow.payload}</div>
                      </div>
                    </div>
                  </div>
                  {i < report.logicFlows.length - 1 && (
                    <div className="flex items-center group/arrow">
                      <div className="w-10 h-px bg-gradient-to-r from-blue-500 to-purple-500 opacity-30 group-hover/arrow:opacity-100 transition-opacity"></div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-purple-500 -ml-2"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-10 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Record: IX-INVEST-ELITE • Signatory: Master Investigator IX • Timestamp: {new Date().toLocaleTimeString()}
          </div>
          <button 
            onClick={onClose}
            className="px-16 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_15px_40px_rgba(59,130,246,0.3)] hover:scale-[1.05] active:scale-95"
          >
            Acknowledge Findings
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvestigationModal;