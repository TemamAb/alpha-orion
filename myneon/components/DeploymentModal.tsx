
import React from 'react';
import { DeploymentReport, Environment } from '../types';

interface Props {
  moduleName: string;
  report: DeploymentReport;
  onClose: () => void;
}

const DeploymentModal: React.FC<Props> = ({ moduleName, report, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <div className="glass w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col border border-emerald-500/30 shadow-[0_0_100px_rgba(16,185,129,0.2)]">
        {/* Header */}
        <div className={`p-6 border-b border-white/10 flex justify-between items-center ${report.status === 'Success' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl shadow-lg ${report.status === 'Success' ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-red-600 shadow-red-500/20'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2v20"/><path d="m17 17-5 5-5-5"/><path d="m17 7-5-5-5 5"/></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                Safe-Release Receipt: <span className="text-emerald-400 font-mono">{moduleName}</span>
              </h2>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Target Environment: {report.environment}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${report.status === 'Success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                  Status: {report.status}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Transaction Hash</span>
              <div className="text-xs font-mono text-emerald-400 break-all bg-black/40 p-2 rounded-lg border border-white/5">
                {report.txHash}
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Resource Cost</span>
              <div className="text-xl font-black text-white font-mono">
                {report.gasUsed.toLocaleString()} <span className="text-xs font-normal text-slate-500">GAS</span>
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Finality Time</span>
              <div className="text-xl font-black text-white font-mono">
                {new Date(report.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Deployment Summary */}
          <section>
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4">Deployment Specialist Summary</h3>
            <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 text-slate-300 italic leading-relaxed text-lg font-light">
              "{report.deploymentSummary}"
            </div>
          </section>

          {/* Detailed Logs */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Technical Execution Stream</h3>
            <div className="bg-black/40 rounded-2xl border border-white/10 p-6 font-mono text-xs space-y-2">
              {report.logs.map((log, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-emerald-900 font-bold">[{i.toString().padStart(2, '0')}]</span>
                  <span className="text-emerald-400/70">{log}</span>
                </div>
              ))}
              <div className="pt-2 flex items-center gap-2 text-emerald-500/40">
                <span className="animate-pulse">_</span>
                <span>END OF STREAM</span>
              </div>
            </div>
          </section>
        </div>

        {/* Action Footer */}
        <div className="p-8 bg-white/5 border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-500 font-mono italic">
            Deployment UUID: {Math.random().toString(36).substr(2, 12).toUpperCase()}
          </div>
          <button 
            onClick={onClose}
            className="px-10 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-100"
          >
            Acknowledge Release
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeploymentModal;
