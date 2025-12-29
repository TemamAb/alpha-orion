
import React from 'react';
import { ProtocolReport } from '../types';
import Tooltip from './Tooltip';

interface Props {
  moduleName: string;
  report: ProtocolReport;
  onClose: () => void;
  onProceed: () => void;
}

const ProtocolVerificationModal: React.FC<Props> = ({ moduleName, report, onClose, onProceed }) => {
  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[120px]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="glass w-full max-w-5xl h-[90vh] rounded-[4rem] overflow-hidden flex flex-col border border-purple-500/40 shadow-[0_0_250px_rgba(168,85,247,0.15)] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse"></div>
        
        {/* Header - High Security Aesthetic */}
        <div className="p-10 border-b border-white/10 flex justify-between items-center bg-purple-900/10">
          <div className="flex items-center gap-8">
            <div className="p-5 bg-purple-600 rounded-[2rem] shadow-2xl shadow-purple-500/40 relative group overflow-hidden">
              <div className="absolute inset-0 bg-white/20 animate-ping rounded-[2rem] opacity-20"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Protocol IX Verification</h2>
              <div className="flex items-center gap-6 mt-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">Agent: Benchmark Specialist IX</span>
                <div className="px-4 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Protocol Handshake Verified</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all group">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-90 transition-transform"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-12 custom-scrollbar flex-grow bg-[#020205] space-y-16">
          {/* Executive Synthesis */}
          <section className="text-center max-w-3xl mx-auto">
            <h3 className="text-xs font-black text-purple-500 uppercase tracking-[0.8em] mb-8">Requirement Synthesis</h3>
            <div className="p-10 bg-purple-500/5 border border-purple-500/20 rounded-[3rem] text-slate-300 italic text-2xl font-light leading-relaxed">
              "{report.requirementAnalysis}"
            </div>
          </section>

          {/* Elite 0.001% Benchmark Dashboard */}
          <section className="space-y-10">
            <div className="flex items-center justify-between">
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]"></span>
                  Elite Grade Competitive Matrix
               </h3>
               <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Benchmark Mode: Top 0.001% (Sovereign)</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {report.eliteBenchmarkComparison.map((item, i) => (
                <div key={i} className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:border-purple-500/40 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                     <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  
                  <div className="flex justify-between items-start mb-8">
                    <h4 className="text-lg font-black text-white uppercase tracking-widest">{item.metric}</h4>
                    <span className="text-[8px] font-mono font-bold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20 uppercase tracking-widest">Validated</span>
                  </div>

                  <div className="grid grid-cols-2 gap-10 mb-8">
                    <div>
                      <div className="text-[9px] text-slate-600 uppercase font-black mb-1">AstraElite Target</div>
                      <div className="text-2xl font-mono font-black text-white">{item.astraEliteValue}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-600 uppercase font-black mb-1">Elite 0.001% Baseline</div>
                      <div className="text-2xl font-mono font-black text-emerald-400">{item.top001Value}</div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5">
                    <p className="text-[11px] text-slate-400 leading-relaxed italic">
                      <span className="text-purple-500 font-black uppercase tracking-tighter mr-2">Precision Gap:</span> 
                      {item.gapAnalysis}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Submission Manifest & Deliverables */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <section className="lg:col-span-7">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] mb-8">Submission Manifest Seal</h3>
              <div className="p-10 bg-black/60 rounded-[3rem] border border-white/10 space-y-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-purple-500/[0.01] pointer-events-none"></div>
                <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-purple-500/5 blur-[80px] rounded-full"></div>
                
                <div className="grid grid-cols-2 gap-10">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-2">Seal Identifier</span>
                    <Tooltip content="Cryptographic identifier for this protocol analysis cycle.">
                       <span className="text-sm font-mono text-purple-400 font-bold bg-purple-400/5 px-3 py-1 rounded border border-purple-400/20 cursor-copy">{report.submissionManifest.sealId}</span>
                    </Tooltip>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-2">Integrity Grade</span>
                    <span className="text-lg font-mono text-emerald-400 font-black uppercase">{report.submissionManifest.integrityGrade}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-3">Cryptographic Checksum (SHA-256)</span>
                  <div className="text-[10px] font-mono text-slate-400 bg-black/40 p-4 rounded-2xl border border-white/5 break-all leading-relaxed shadow-inner">
                    {report.submissionManifest.checksum}
                  </div>
                </div>

                <div className="flex justify-between items-end pt-4">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-3">Authorized Signatories</span>
                    <div className="flex flex-wrap gap-2">
                      {report.submissionManifest.authorizedRoles.map(role => (
                        <span key={role} className="text-[9px] px-3 py-1 bg-white/5 border border-white/10 rounded-full text-slate-300 uppercase font-black tracking-widest">{role}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-2">Priority Level</span>
                    <span className={`text-xs font-black uppercase tracking-widest px-4 py-1 rounded-full border ${
                      report.submissionManifest.priorityLevel === 'Immediate-Forge' ? 'border-red-500/50 text-red-500 bg-red-500/10 animate-pulse' : 'border-purple-500/50 text-purple-400 bg-purple-500/10'
                    }`}>
                       {report.submissionManifest.priorityLevel}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="lg:col-span-5 flex flex-col">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] mb-8">Sealed Deliverables</h3>
              <div className="space-y-4 flex-grow">
                {report.deliverablesPrepared.map((del, i) => (
                  <div key={i} className="flex gap-5 items-center p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl group hover:border-emerald-500/30 transition-all">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-[0_10px_25px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="m5 12 5 5L20 7"/></svg>
                    </div>
                    <span className="text-xs font-black text-slate-200 uppercase tracking-widest leading-tight">{del}</span>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-8 bg-white/[0.02] rounded-[2.5rem] border border-white/5 text-center">
                 <div className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] mb-3">Protocol Specialist Signature</div>
                 <div className="text-xl font-mono text-purple-400 font-bold tracking-[0.3em] truncate">
                   {report.protocolSignature}
                 </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer - Final Commitment Action */}
        <div className="p-12 bg-white/[0.02] border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="text-[10px] text-slate-600 font-mono uppercase tracking-[0.2em] flex flex-col md:flex-row items-center gap-4">
             <span>Record: IX-PROTO-COMMIT</span>
             <span className="hidden md:block">|</span>
             <span>TS: {new Date(report.timestamp).toLocaleString()}</span>
             <span className="hidden md:block">|</span>
             <span className="text-purple-500 font-black">Status: Finality Achieved</span>
          </div>
          <div className="flex gap-6 w-full md:w-auto">
            <button 
              onClick={onClose}
              className="flex-1 md:flex-none px-10 py-5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Abort Protocol
            </button>
            <button 
              onClick={onProceed}
              className="flex-1 md:flex-none px-16 py-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 hover:from-purple-600 hover:via-indigo-600 hover:to-blue-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all shadow-[0_20px_60px_rgba(168,85,247,0.4)] hover:scale-[1.05] active:scale-95 flex items-center justify-center gap-4 group"
            >
              Commit & Initialize Forge Cycle
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform"><path d="m5 12 5 5L20 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocolVerificationModal;
