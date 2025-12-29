
import React from 'react';
import { AuditReport, CertLevel } from '../types';

interface Props {
  moduleName: string;
  report: AuditReport;
  certLevel: CertLevel;
  onClose: () => void;
}

const AuditModal: React.FC<Props> = ({ moduleName, report, certLevel, onClose }) => {
  const getLevelColor = (level: CertLevel) => {
    switch (level) {
      case CertLevel.PLATINUM: return 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10';
      case CertLevel.GOLD: return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
      case CertLevel.SILVER: return 'text-slate-300 border-slate-300/30 bg-slate-300/10';
      default: return 'text-red-400 border-red-400/30 bg-red-400/10';
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <div className="glass w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col border border-amber-500/20 shadow-[0_0_100px_rgba(245,158,11,0.15)]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-amber-500/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                Specialist Audit: <span className="text-amber-400 font-mono">{moduleName}</span>
              </h2>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Specialist Unit: Auditor-X1</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase border ${getLevelColor(certLevel)}`}>
                  Grade: {certLevel} ({report.score}%)
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-10 custom-scrollbar">
          {/* Main Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: 'Code Quality', val: report.criteria.codeQuality, color: 'text-blue-400' },
              { label: 'Test Coverage', val: report.criteria.testCoverage, color: 'text-purple-400' },
              { label: 'Schema Compliance', val: report.criteria.schemaCompliance, color: 'text-emerald-400' }
            ].map((item, i) => (
              <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{item.label}</span>
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                    <circle 
                      cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" 
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - item.val / 100)}`}
                      className={item.color}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className={`absolute text-xl font-black ${item.color}`}>{item.val}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Report Summary */}
          <section>
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Auditor-X1 Executive Summary
            </h3>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-slate-300 leading-relaxed text-lg font-light italic">
              "{report.report}"
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Recommendations */}
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-5">Improvement Directives</h3>
              <div className="space-y-3">
                {report.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5 group hover:border-amber-500/30 transition-all">
                    <span className="text-amber-500 font-bold font-mono">#{i + 1}</span>
                    <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{rec}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Certification Meta */}
            <section className="bg-black/40 rounded-3xl p-6 border border-white/10 flex flex-col justify-center">
              <div className="text-center mb-6">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Certification ID</div>
                <div className="text-lg font-mono text-white tracking-widest bg-white/5 py-2 px-4 rounded-xl border border-white/5">
                  {report.signature.slice(0, 24).toUpperCase()}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase">
                  <span>Timestamp</span>
                  <span>{new Date(report.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase">
                  <span>Signatory</span>
                  <span>ASTRAELITE-CE-V1</span>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-center">
                  <div className="px-6 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Signed & Verified</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-8 bg-white/5 border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-500 font-mono italic">
            Audit Hash: {report.signature}
          </div>
          <button 
            onClick={onClose}
            className="px-10 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-100"
          >
            Acknowledge Audit Findings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditModal;
