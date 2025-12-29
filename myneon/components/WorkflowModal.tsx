
import React from 'react';
import { WorkflowState, ModuleInfo } from '../types';

interface Props {
  state: WorkflowState;
  modules: ModuleInfo[];
  onClose: () => void;
  onFixModule: (moduleId: string) => void;
}

const WorkflowModal: React.FC<Props> = ({ state, modules, onClose, onFixModule }) => {
  const currentPhase = state.phases.find(p => p.id === state.currentPhaseId);

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[60px]">
      <div className="glass w-full max-w-6xl h-[90vh] rounded-[3.5rem] overflow-hidden flex flex-col border border-purple-500/30 shadow-[0_0_150px_rgba(139,92,246,0.2)]">
        
        {/* Header */}
        <div className="p-10 border-b border-white/10 flex justify-between items-center bg-purple-500/5 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse"></div>
          <div className="flex items-center gap-8">
            <div className="p-5 bg-purple-600 rounded-3xl shadow-2xl shadow-purple-500/30 relative">
               <div className="absolute inset-0 bg-white/20 animate-ping rounded-3xl opacity-20"></div>
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
            </div>
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Cluster Navigator IX</h2>
              <div className="flex items-center gap-6 mt-1">
                <span className="text-[11px] text-slate-500 uppercase font-black tracking-widest">Protocol: Elite Progress Tracker</span>
                <div className="px-4 py-1 bg-purple-500/20 rounded-full border border-purple-500/30 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Engine Mode: {state.engineStatus}</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all hover:scale-110 active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow flex overflow-hidden bg-[#020204]">
          {/* Enhanced Sidebar Stepper */}
          <div className="w-96 border-r border-white/5 p-10 space-y-10 bg-black/40">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mb-10">Project Roadmap</h3>
            <div className="space-y-12">
              {state.phases.map((phase, i) => (
                <div key={phase.id} className="relative flex gap-6 group">
                  {i < state.phases.length - 1 && (
                    <div className={`absolute left-3.5 top-8 w-[2px] h-full ${phase.status === 'completed' ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-slate-800'}`}></div>
                  )}
                  <div className={`w-8 h-8 rounded-2xl border-2 flex-shrink-0 flex items-center justify-center z-10 transition-all duration-500 ${
                    phase.status === 'completed' ? 'bg-purple-600 border-purple-400 shadow-lg shadow-purple-500/20' : 
                    phase.status === 'active' ? 'bg-black border-purple-500 scale-110' : 'bg-black border-slate-800'
                  }`}>
                    {phase.status === 'completed' ? (
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M20 6 9 17l-5-5"/></svg>
                    ) : (
                       <span className={`text-xs font-black ${phase.status === 'active' ? 'text-purple-400' : 'text-slate-800'}`}>{i+1}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className={`text-xs font-black uppercase tracking-widest transition-colors ${phase.status === 'active' ? 'text-purple-400' : phase.status === 'completed' ? 'text-slate-200' : 'text-slate-700'}`}>
                      {phase.name}
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium leading-relaxed max-w-[200px]">{phase.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Benchmark & Compliance Hub */}
          <div className="flex-grow p-12 overflow-y-auto custom-scrollbar space-y-12">
            
            {/* Sync Progress */}
            <section className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L14.34 6.68l3.98 3.98 4.32-4.32a1.21 1.21 0 0 0 0-1.72z"/><path d="M12.8 8.23l-3.98-3.98-1.03 1.03c-1.2 1.21-1.2 3.14 0 4.35l4.33 4.33a3.07 3.07 0 0 0 4.34 0l1.03-1.03-3.98-3.98z"/><path d="m7.6 13.43-4.33 4.33a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.21 1.21 0 0 0 1.72 0l4.33-4.33-3-3z"/></svg>
              </div>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] mb-2">Cluster Synchronization</h3>
                  <div className="text-5xl font-mono font-black text-white">
                    {state.overallProgress.toFixed(1)}<span className="text-xl text-purple-500/50">%</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Elite Baseline</div>
                  <div className="text-xs font-mono font-bold text-emerald-400">TARGET: 100.0%</div>
                </div>
              </div>
              <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 p-1">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400 rounded-full transition-all duration-1500 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                  style={{ width: `${state.overallProgress}%` }}
                >
                  <div className="w-full h-full bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </section>

            {/* Compliance Matrix */}
            <section className="space-y-8">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Benchmark Compliance Matrix
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map(mod => (
                  <div key={mod.id} className={`p-6 rounded-[2rem] border transition-all relative overflow-hidden group ${
                    mod.score === 100 ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-white/[0.02] border-white/5 hover:border-purple-500/30'
                  }`}>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{mod.name.split(' ').pop()}</span>
                      {mod.score === 100 ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M20 6 9 17l-5-5"/></svg>
                        </div>
                      ) : (
                         <span className="text-[10px] font-mono font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{mod.score}%</span>
                      )}
                    </div>
                    
                    <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-tighter truncate">{mod.name}</h4>
                    
                    {mod.score < 100 ? (
                      <div className="space-y-4">
                        <div className="text-[9px] text-slate-600 font-medium italic leading-relaxed">
                          Precision gap detected. Benchmark mismatch prevents elite-grade classification.
                        </div>
                        <button 
                          onClick={() => onFixModule(mod.id)}
                          className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                        >
                          Initiate Optimization Cycle
                        </button>
                      </div>
                    ) : (
                      <div className="text-[9px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                        Benchmark Compliant
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Navigator Priorities */}
            <section className="p-10 bg-purple-500/5 border border-purple-500/20 rounded-[3rem] relative group">
               <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-125 transition-all duration-1000">
                  <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
               </div>
               <h3 className="text-[11px] font-black text-purple-500 uppercase tracking-[0.5em] mb-6 flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 8V4"/><path d="M12 16v.01"/><path d="M17.07 17.07 19 19"/><path d="M19 5l-1.93 1.93"/><path d="M5 19l1.93-1.93"/><path d="M6.93 6.93 5 5"/></svg>
                  Strategic Priority Directive
               </h3>
               <div className="space-y-4">
                 {state.alerts.map((alert, i) => (
                   <div key={i} className="flex gap-6 items-start">
                     <span className={`text-[10px] font-mono font-bold uppercase mt-1 ${alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`}>
                       [{alert.severity}]
                     </span>
                     <p className="text-slate-300 font-medium leading-relaxed italic text-lg">
                       "{alert.message}"
                     </p>
                   </div>
                 ))}
                 {state.alerts.length === 0 && (
                   <p className="text-emerald-400 font-medium italic text-lg leading-relaxed">
                     "All tiers synchronized to elite baseline. Handover to production monitoring is imminent."
                   </p>
                 )}
               </div>
            </section>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-10 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest flex items-center gap-4">
            AstraElite Navigator Hub • Global Precision: {state.overallProgress.toFixed(2)}%
            <span className="text-slate-800">|</span>
            Last Scan: {new Date().toLocaleTimeString()}
          </div>
          <button 
            onClick={onClose}
            className="px-16 py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_20px_60px_rgba(139,92,246,0.3)] hover:scale-[1.05] active:scale-95 flex items-center gap-4"
          >
            Acknowledge Directives
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 5 5L20 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowModal;
