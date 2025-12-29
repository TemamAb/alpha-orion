
import React from 'react';
import { IntegrationReport } from '../types';
import Tooltip from './Tooltip';

interface Props {
  report: IntegrationReport;
  onClose: () => void;
}

const IntegrationModal: React.FC<Props> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[120px]">
      <div className="glass w-full max-w-6xl h-[90vh] rounded-[4rem] overflow-hidden flex flex-col border border-pink-500/40 shadow-[0_0_200px_rgba(236,72,153,0.15)] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent animate-pulse"></div>
        
        {/* Header */}
        <div className="p-10 border-b border-white/10 flex justify-between items-center bg-pink-900/10">
          <div className="flex items-center gap-8">
            <div className="p-5 bg-pink-600 rounded-[2rem] shadow-2xl shadow-pink-500/40 relative group overflow-hidden">
              <div className="absolute inset-0 bg-white/20 animate-ping rounded-[2rem] opacity-20"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">System Integration Mesh</h2>
              <div className="flex items-center gap-6 mt-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">Agent: Integration Architect IX</span>
                <div className="px-4 py-1 bg-pink-500/10 rounded-full border border-pink-500/30 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Cluster Cohesion Active</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all group">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-90 transition-transform"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-12 custom-scrollbar bg-[#020205] space-y-16">
          
          {/* Protocol Verification Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <section className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] flex items-center gap-6 group">
                <div className="p-4 bg-emerald-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <div>
                   <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Protocol 1: Blockchain Native</div>
                   <div className="text-xs font-mono text-slate-300 truncate max-w-sm">Proof: {report.blockchainAnchoredProof}</div>
                </div>
             </section>
             <section className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-[2.5rem] flex items-center gap-6 group">
                <div className="p-4 bg-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
                <div>
                   <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Protocol 2: Industry Validated</div>
                   <div className="text-xs font-bold text-white uppercase">{report.industryBenchmarkVerified ? '0.001% Elite Benchmark Pass' : 'Verification Pending'}</div>
                </div>
             </section>
          </div>

          {/* Global Cohesion Score */}
          <section className="text-center max-w-4xl mx-auto space-y-8">
             <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-pink-500/10 scale-110"></div>
                <svg className="w-full h-full -rotate-90">
                   <circle cx="96" cy="96" r="88" fill="none" stroke="rgba(236,72,153,0.05)" strokeWidth="12" />
                   <circle 
                     cx="96" cy="96" r="88" fill="none" stroke="currentColor" strokeWidth="12" 
                     strokeDasharray={`${2 * Math.PI * 88}`}
                     strokeDashoffset={`${2 * Math.PI * 88 * (1 - report.cohesionScore / 100)}`}
                     className="text-pink-500 transition-all duration-2000"
                     strokeLinecap="round"
                   />
                </svg>
                <div className="absolute flex flex-col items-center">
                   <div className="text-6xl font-mono font-black text-white">{report.cohesionScore}%</div>
                   <div className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Mesh Cohesion</div>
                </div>
             </div>
             <p className="text-slate-400 text-lg font-light leading-relaxed italic px-10">
               "{report.assemblyManifest}" - All integrated modules are currently communicating via zero-copy buffer handshakes.
             </p>
          </section>

          {/* Cross-Tier Handshake Logs */}
          <section className="space-y-10">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-4">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_10px_#ec4899]"></span>
                Inter-Module Handshake Registry
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {report.handshakeLogs.map((log, i) => (
                  <div key={i} className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:border-pink-500/30 transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                       <div className="flex items-center gap-4">
                          <span className="text-xs font-mono text-slate-600">0{i+1}</span>
                          <div className="flex items-center gap-3">
                             <span className="text-sm font-black text-white uppercase">{log.source}</span>
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="3"><path d="m9 18 6-6-6-6"/></svg>
                             <span className="text-sm font-black text-white uppercase">{log.target}</span>
                          </div>
                       </div>
                       <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase ${log.status === 'Optimized' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                          {log.status}
                       </span>
                    </div>
                    <div className="grid grid-cols-2 gap-10">
                       <div>
                          <div className="text-[9px] text-slate-600 uppercase font-black mb-1">Protocol</div>
                          <div className="text-lg font-mono font-bold text-slate-300">{log.protocol}</div>
                       </div>
                       <div className="text-right">
                          <div className="text-[9px] text-slate-600 uppercase font-black mb-1">Handshake Latency</div>
                          <div className="text-lg font-mono font-black text-pink-400">{log.latencyNs}ns</div>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </section>

          {/* Assembly Manifest & Signature */}
          <section className="p-12 bg-white/[0.02] border border-white/5 rounded-[4rem] text-center space-y-8">
             <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.6em]">Elite Integration Signature</h3>
             <Tooltip content="Formal cryptographic signature issued by the Integration Architect IX upon successful cluster-wide unit simulation." position="top">
                <div className="text-3xl font-mono font-black text-pink-500 tracking-[0.3em] truncate cursor-help">
                   {report.eliteComplianceSignature}
                </div>
             </Tooltip>
             <div className="flex justify-center gap-10 pt-10 border-t border-white/5">
                <div>
                   <div className="text-[8px] text-slate-700 uppercase font-black mb-1">Integrated Units</div>
                   <div className="text-xl font-mono font-black text-white">{report.integratedModules.length}</div>
                </div>
                <div className="w-px h-10 bg-white/5"></div>
                <div>
                   <div className="text-[8px] text-slate-700 uppercase font-black mb-1">Specs Verified</div>
                   <div className="text-xl font-mono font-black text-emerald-400">0.001% GRADE</div>
                </div>
             </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-12 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Aineonlite Integration-IX • Record: ASSEMBLY-CERT • Sync: {new Date(report.timestamp).toLocaleTimeString()}
          </div>
          <button 
            onClick={onClose}
            className="px-16 py-5 bg-pink-600 hover:bg-pink-500 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all shadow-[0_20px_60px_rgba(236,72,153,0.4)] hover:scale-[1.05] active:scale-95 flex items-center gap-4 group"
          >
            Authorize System Handshake
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform"><path d="m5 12 5 5L20 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationModal;
