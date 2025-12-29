
import React from 'react';
import { SwarmTrainingReport } from '../types';
import Tooltip from './Tooltip';

interface Props {
  report: SwarmTrainingReport;
  moduleName: string;
  onClose: () => void;
}

const SwarmTrainingModal: React.FC<Props> = ({ report, moduleName, onClose }) => {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[100px]">
      <div className="glass w-full max-w-6xl h-[85vh] rounded-[4rem] overflow-hidden flex flex-col border border-blue-500/40 shadow-[0_0_150px_rgba(59,130,246,0.3)] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse"></div>
        
        {/* Header */}
        <div className="p-10 border-b border-white/10 flex justify-between items-center bg-blue-600/5">
          <div className="flex items-center gap-8">
            <div className="p-5 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-500/40 relative">
               <div className="absolute inset-0 bg-white/20 animate-ping rounded-3xl opacity-20"></div>
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 2v8"/><path d="m16.2 16.2-4.2-4.2-4.2 4.2"/><path d="M12 12v10"/><circle cx="12" cy="12" r="10"/></svg>
            </div>
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Swarm Neural Sync: <span className="text-blue-400 font-mono">{moduleName}</span></h2>
              <div className="flex items-center gap-6 mt-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Provisioning Layer: {report.trainerId}</span>
                <div className="px-4 py-1 bg-blue-500/10 rounded-full border border-blue-500/30 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Real-Time Knowledge Velocity: {report.knowledgeVelocity} pk/s</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow flex overflow-hidden bg-[#020204]">
          {/* Knowledge Shards Injected */}
          <div className="w-96 border-r border-white/5 p-10 space-y-10 bg-black/40 overflow-y-auto custom-scrollbar">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mb-10">Injected Shards</h3>
            <div className="space-y-6">
              {report.shardsInjected.map((shard, i) => (
                <div key={shard.id} className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl hover:border-blue-500/30 transition-all group">
                  <div className="flex justify-between items-center mb-3">
                     <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase ${
                       shard.category === 'Logic' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                       shard.category === 'Security' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                       'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                     }`}>
                       {shard.category}
                     </span>
                     <span className="text-xs font-mono font-black text-emerald-500">+{shard.performanceDelta}%</span>
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">{shard.label}</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed italic">"{shard.description}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Main Synapse Visual & Progress */}
          <div className="flex-grow p-12 overflow-y-auto custom-scrollbar flex flex-col gap-12">
            <section className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] text-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none animate-pulse"></div>
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-10">Neural Convergence Progress</h3>
               <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                     <circle cx="96" cy="96" r="88" fill="none" stroke="rgba(59,130,246,0.05)" strokeWidth="12" />
                     <circle 
                       cx="96" cy="96" r="88" fill="none" stroke="currentColor" strokeWidth="12" 
                       strokeDasharray={`${2 * Math.PI * 88}`}
                       strokeDashoffset={`${2 * Math.PI * 88 * (1 - report.neuralConvergenceScore / 100)}`}
                       className="text-blue-500 transition-all duration-2000"
                       strokeLinecap="round"
                     />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-6xl font-mono font-black text-white">{report.neuralConvergenceScore}%</span>
                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-2">SYNOPSIS COMPLETE</span>
                  </div>
               </div>
               <p className="text-slate-400 italic text-lg font-light max-w-2xl mx-auto leading-relaxed">
                 "Agent ${moduleName} has successfully absorbed the latest specialty swarm packets. Logic is now calibrated to Top 0.001% industry standards."
               </p>
            </section>

            <section className="bg-black/60 rounded-[3rem] p-10 border border-white/10">
               <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mb-8">Swarm Synchronization Logs</h3>
               <div className="space-y-3 font-mono text-[10px]">
                  {report.trainingLogs.map((log, i) => (
                    <div key={i} className="flex gap-6 group/log">
                       <span className="text-blue-900 font-bold">[{i.toString().padStart(3, '0')}]</span>
                       <span className="text-slate-500 group-hover/log:text-blue-300 transition-colors">{log}</span>
                    </div>
                  ))}
                  <div className="pt-4 flex items-center gap-3 text-blue-500/30">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div>
                     <span className="animate-pulse">_ CONTINUOUS INJECTION ACTIVE</span>
                  </div>
               </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest flex items-center gap-4">
            Astra-Swarm Protocol • Velocity Verified • Cycle Refined: {new Date(report.timestamp).toLocaleTimeString()}
          </div>
          <button 
            onClick={onClose}
            className="px-16 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] transition-all shadow-[0_20px_60px_rgba(59,130,246,0.3)] hover:scale-[1.05] active:scale-95 flex items-center gap-4 group"
          >
            Seal Neural Upgrade
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform"><path d="m5 12 5 5L20 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwarmTrainingModal;
