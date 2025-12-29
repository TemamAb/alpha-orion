
import React, { useState } from 'react';
import { TotalScanReport, TotalScanIssue } from '../types';
import { executeAutoFix } from '../services/scanFixService';
import Tooltip from './Tooltip';

interface Props {
  report: TotalScanReport;
  onClose: () => void;
  onUpdate: (newReport: TotalScanReport) => void;
}

const TotalScanModal: React.FC<Props> = ({ report, onClose, onUpdate }) => {
  const [fixingId, setFixingId] = useState<string | null>(null);

  const handleFix = async (issue: TotalScanIssue) => {
    setFixingId(issue.id);
    
    const fixingReport = {
      ...report,
      issues: report.issues.map(iss => iss.id === issue.id ? { ...iss, status: 'Fixing' as const } : iss)
    };
    onUpdate(fixingReport);

    const result = await executeAutoFix(issue);
    
    const resolvedReport = {
      ...report,
      issues: report.issues.map(iss => iss.id === issue.id ? { 
        ...iss, 
        status: 'Resolved' as const,
        description: `[RESOLVED] ${iss.description}\nFix Details: ${result.fixDetails}`
      } : iss),
      scanLogs: [...report.scanLogs, `[SENTINEL] Issue ${issue.id} successfully rectified.`]
    };
    onUpdate(resolvedReport);
    setFixingId(null);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[100px]">
      <div className="glass w-full max-w-6xl h-[90vh] rounded-[4rem] overflow-hidden flex flex-col border border-emerald-500/40 shadow-[0_0_200px_rgba(16,185,129,0.2)]">
        
        {/* Header */}
        <div className="p-10 border-b border-white/10 flex justify-between items-center bg-emerald-900/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse"></div>
          <div className="flex items-center gap-8">
            <div className="p-5 bg-emerald-600 rounded-[2rem] shadow-2xl shadow-emerald-900/40 relative group">
              <div className="absolute inset-0 bg-white/20 animate-ping rounded-[2rem] opacity-20"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Cluster Sentinel Console</h2>
              <div className="flex items-center gap-6 mt-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Signature: {report.scanSignature}</span>
                <div className="px-4 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Global Scan Active</span>
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
            
            {/* Top Health Indicator */}
            <Tooltip content="Weighted integrity score across all static bytecode and logic contracts. Top 0.001% grade requires >99.9%." position="bottom">
              <section className="p-10 bg-emerald-500/5 border border-emerald-500/20 rounded-[3rem] relative overflow-hidden cursor-help">
                 <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-2">Overall Mesh Integrity</h3>
                      <div className="text-6xl font-mono font-black text-white">{report.overallHealth}<span className="text-xl text-emerald-500/50">%</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Elite Grade Threshold</div>
                      <div className="text-xs font-mono font-bold text-emerald-400">BENCHMARK: 99.9%</div>
                    </div>
                 </div>
                 <div className="w-full h-2 bg-black rounded-full overflow-hidden mt-8 border border-white/5">
                    <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 transition-all duration-1500" style={{ width: `${report.overallHealth}%` }}></div>
                 </div>
              </section>
            </Tooltip>

            {/* Issues List */}
            <section className="space-y-8">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-4">
                <span className="w-10 h-px bg-emerald-500/30"></span>
                Detected Cluster Exceptions
              </h3>
              <div className="grid grid-cols-1 gap-6">
                {report.issues.map((issue) => (
                  <div key={issue.id} className={`p-8 rounded-[2.5rem] border transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 ${
                    issue.status === 'Resolved' ? 'bg-emerald-500/5 border-emerald-500/30 opacity-60' : 
                    issue.severity === 'Critical' ? 'bg-red-500/5 border-red-500/30' : 'bg-white/[0.02] border-white/5'
                  }`}>
                    <div className="flex-grow space-y-4">
                       <div className="flex items-center gap-4">
                          <span className="text-[9px] font-mono text-slate-700 uppercase">ID: {issue.id}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${
                            issue.severity === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                            issue.severity === 'Warning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                            'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          }`}>{issue.severity}</span>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/10">{issue.moduleName}</span>
                       </div>
                       <h4 className="text-xl font-black text-white uppercase tracking-tighter leading-tight">{issue.description}</h4>
                       <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Remediation Blueprint</span>
                          <p className="text-[11px] text-slate-400 font-medium italic">"{issue.remediation}"</p>
                       </div>
                    </div>
                    <div className="shrink-0 w-full lg:w-48 text-center lg:text-right">
                       {issue.status === 'Resolved' ? (
                         <div className="flex flex-col items-center lg:items-end gap-2">
                           <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><path d="m20 6-11 11-5-5"/></svg>
                           </div>
                           <span className="text-[10px] font-black text-emerald-500 uppercase">Issue Rectified</span>
                         </div>
                       ) : (
                         <Tooltip content="Trigger the AI Sentinel to inject a localized logic patch and restore module invariants." position="left">
                           <button 
                             onClick={() => handleFix(issue)}
                             disabled={fixingId !== null}
                             className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                               fixingId === issue.id ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-500/20'
                             }`}
                           >
                             {fixingId === issue.id ? 'Injecting Hot-Patch...' : 'Execute Autonomous Fix'}
                           </button>
                         </Tooltip>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Scan Logs Area */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-12">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] mb-6">Sentinel Telemetry Feed</h3>
                <div className="p-8 bg-black/60 rounded-[2.5rem] border border-white/10 font-mono text-[10px] space-y-2 h-48 overflow-y-auto custom-scrollbar">
                  {report.scanLogs.map((log, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-emerald-900">[{new Date(report.timestamp).toLocaleTimeString()}]</span>
                      <span className="text-emerald-400/60 leading-relaxed">{log}</span>
                    </div>
                  ))}
                  <div className="pt-2 flex items-center gap-2 text-emerald-500/20">
                    <span className="animate-pulse">_</span>
                    <span>SENTINEL IDLE: CLUSTER UNDER HIGH-FIDELITY OBSERVATION</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Module: SENTINEL-IX • Grade: ELITE • Sync: {new Date(report.timestamp).toLocaleTimeString()}
          </div>
          <button 
            onClick={onClose}
            className="px-16 py-4 bg-emerald-700 hover:bg-emerald-600 text-white font-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-emerald-900/20 hover:scale-[1.05] active:scale-95"
          >
            Acknowledge Sentinel Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default TotalScanModal;
