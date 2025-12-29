
import React from 'react';
import { SelfHealingReport } from '../types';

interface Props {
  report: SelfHealingReport;
  onClose: () => void;
}

const SelfHealingModal: React.FC<Props> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
      <div className="glass w-full max-w-5xl max-h-[92vh] rounded-[2.5rem] overflow-hidden flex flex-col border border-emerald-500/40 shadow-[0_0_100px_rgba(16,185,129,0.2)]">
        {/* Header */}
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-emerald-500/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse"></div>
          <div className="flex items-center gap-6">
            <div className="p-4 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">
                Autonomous Self-Healing Cycle
              </h2>
              <div className="flex items-center gap-6 mt-2">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Unit: Medic-Elite-IX</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    Integrity Score: {report.systemIntegrityScore}%
                  </span>
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-10 overflow-y-auto space-y-12 custom-scrollbar flex-grow bg-[#050507]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Anomalies */}
            <div className="lg:col-span-7 space-y-8">
              <section>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Anomalies Detected
                </h3>
                <div className="space-y-4">
                  {report.anomaliesDetected.map((anom, i) => (
                    <div key={i} className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 hover:border-amber-500/30 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-amber-500 font-mono font-bold text-xs uppercase">[{anom.module}]</span>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                          anom.severity === 'Critical' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                        }`}>
                          {anom.severity}
                        </span>
                      </div>
                      <p className="text-slate-300 font-medium leading-relaxed mb-4 text-sm">{anom.description}</p>
                      <div className="pt-4 border-t border-white/5">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-1">Root Cause Analysis</span>
                        <p className="text-xs text-slate-500 font-mono italic">{anom.rootCause}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Fixes & Logs */}
            <div className="lg:col-span-5 space-y-8">
              <section>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Repairs Injected
                </h3>
                <div className="space-y-3">
                  {report.fixesApplied.map((fix, i) => (
                    <div key={i} className="p-5 bg-emerald-500/[0.03] rounded-2xl border border-emerald-500/10 flex justify-between items-center group hover:bg-emerald-500/[0.05] transition-all">
                      <div>
                        <div className="text-xs font-black text-emerald-400 uppercase mb-1">{fix.action}</div>
                        <div className="text-[10px] text-slate-500 italic">{fix.result}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-emerald-500">{(fix.impactOnRisk * 100).toFixed(1)}%</div>
                        <div className="text-[8px] text-slate-700 uppercase">Risk Delta</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-black/60 rounded-[2rem] p-8 border border-white/10">
                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-6">Repair Bay Replay</h3>
                <div className="space-y-2 font-mono text-[10px]">
                  {report.healingLogs.map((log, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-emerald-900">{(i+1).toString().padStart(2, '0')}</span>
                      <span className="text-emerald-400/60 leading-relaxed">{log}</span>
                    </div>
                  ))}
                  <div className="pt-2 flex items-center gap-2 text-emerald-500/20">
                    <span className="animate-pulse">_</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-10 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Protocol: Medic-V9 • Integrity Verified • Cycle End: {new Date(report.timestamp).toLocaleTimeString()}
          </div>
          <button 
            onClick={onClose}
            className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-[0_15px_40px_rgba(16,185,129,0.3)] hover:scale-[1.05] active:scale-95"
          >
            Acknowledge Mesh Health
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelfHealingModal;
