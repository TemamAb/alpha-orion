
import React, { useState, useEffect, useMemo } from 'react';
import { ModuleInfo, AssemblyState, ModuleForgeSpec, CertLevel } from '../types';
import { forgeEliteModuleSpec } from '../services/forgeService';
import Logo from './Logo';
import Tooltip from './Tooltip';

interface Props {
  modules: ModuleInfo[];
  onComplete: (updatedModules: ModuleInfo[]) => void;
  onCancel: () => void;
}

const ModuleAssembler: React.FC<Props> = ({ modules, onComplete, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [state, setState] = useState<AssemblyState>(AssemblyState.PROJECTING);
  const [forgeSpec, setForgeSpec] = useState<ModuleForgeSpec | null>(null);
  const [finishedModules, setFinishedModules] = useState<ModuleInfo[]>([]);

  const currentModule = modules[currentIndex];
  
  const progressCount = ((finishedModules.length) / modules.length) * 100;
  // Enhanced workload progress based on tier complexity
  const workloadProgress = useMemo(() => {
    const weights: Record<string, number> = { 'Tier-1': 1, 'Tier-2': 2, 'Tier-3': 3, 'Tier-0': 1.5, 'Tier-X': 5 };
    const totalWeight = modules.reduce((acc, m) => acc + (weights[m.tier.split(':')[0]] || 1), 0);
    const finishedWeight = finishedModules.reduce((acc, m) => acc + (weights[m.tier.split(':')[0]] || 1), 0);
    return (finishedWeight / totalWeight) * 100;
  }, [finishedModules, modules]);

  const handleForge = async () => {
    setState(AssemblyState.FORGING);
    const spec = await forgeEliteModuleSpec(currentModule.name, currentModule.features);
    setForgeSpec(spec);
    setState(AssemblyState.CERTIFIED);
  };

  const handleCertify = () => {
    const updated = {
      ...currentModule,
      certLevel: CertLevel.PLATINUM,
      score: 100,
      isIntegrated: true,
      status: 'certified' as const
    };
    setFinishedModules(prev => [...prev, updated]);
    
    if (currentIndex < modules.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setForgeSpec(null);
      setState(AssemblyState.PROJECTING);
    } else {
      setState(AssemblyState.COMPLETED);
    }
  };

  const handleFinish = () => {
    onComplete(finishedModules);
  };

  return (
    <div className="fixed inset-0 z-[600] bg-[#020204] flex flex-col items-center justify-center p-12 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[200px] rounded-full"></div>
        <div className="grid-bg w-full h-full opacity-10"></div>
      </div>

      {/* Progress Header */}
      <div className="w-full max-w-5xl mb-16 space-y-6 relative z-10">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-4">
             <Logo size={40} className="drop-shadow-[0_0_15px_rgba(0,163,255,0.4)]" />
             <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Engine Genesis Suite</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">Sovereign Alignment In-Progress</p>
             </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Neural Integration</div>
             <div className="text-3xl font-mono font-black text-white">{( (progressCount + workloadProgress) / 2 ).toFixed(1)}%</div>
          </div>
        </div>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden flex gap-1 p-0.5 border border-white/5">
           <div className="h-full bg-blue-600 shadow-[0_0_10px_#3b82f6] transition-all duration-1000" style={{ width: `${progressCount}%` }}></div>
           <div className="h-full bg-indigo-500 opacity-30 transition-all duration-1000" style={{ width: `${workloadProgress - progressCount}%` }}></div>
        </div>
      </div>

      {/* Assembler Stage */}
      <div className="w-full max-w-5xl flex-grow flex items-center justify-center relative">
        
        {state === AssemblyState.COMPLETED ? (
          <div className="text-center space-y-12 animate-in fade-in zoom-in duration-1000">
             <div className="relative mx-auto w-32 h-32">
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl animate-pulse"></div>
                <div className="relative w-full h-full bg-emerald-500 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.5)]">
                   <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="m5 12 5 5L20 7"/></svg>
                </div>
             </div>
             <div>
                <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">Genesis Cluster Sealed</h2>
                <p className="text-slate-400 max-w-md mx-auto text-lg leading-relaxed italic">"The engine has reached 100% neural alignment. All modules are now operating at 0.001% Sovereign Grade."</p>
             </div>
             <button 
               onClick={handleFinish}
               className="px-20 py-6 bg-gradient-to-r from-emerald-600 to-blue-600 hover:scale-105 text-white rounded-[2rem] font-black uppercase tracking-[0.5em] text-xs transition-all shadow-2xl"
             >
               Launch Wealth Engine
             </button>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Holographic Projection */}
            <div className="relative flex items-center justify-center">
               <div className={`w-80 h-80 border-2 border-dashed border-blue-500/20 rounded-[3rem] animate-[spin_20s_linear_infinite] absolute`}></div>
               <div className="relative glass-heavy w-72 h-96 rounded-[3.5rem] border border-blue-500/30 flex flex-col p-10 group overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-pulse"></div>
                  <div className="text-[10px] font-mono text-slate-700 mb-6">#0{currentIndex + 1} // {currentModule.tier}</div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-6 leading-none">{currentModule.name}</h3>
                  <p className="text-xs text-slate-500 italic leading-relaxed mb-10">"{currentModule.purpose}"</p>
                  
                  <div className="mt-auto space-y-4">
                     {currentModule.features.map((f, i) => (
                       <div key={i} className="flex items-center gap-3 text-[10px] text-slate-600 font-mono">
                          <div className="w-1 h-1 rounded-full bg-blue-900"></div>
                          {f}
                       </div>
                     ))}
                  </div>

                  {state === AssemblyState.CERTIFIED && (
                    <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-sm flex items-center justify-center rotate-12 pointer-events-none border-2 border-emerald-500/50">
                       <div className="text-4xl font-black text-emerald-500 border-4 border-emerald-500 px-6 py-2 uppercase tracking-tighter">CERTIFIED</div>
                    </div>
                  )}
               </div>
            </div>

            {/* Right: Synthesis Details */}
            <div className="space-y-10">
               {state === AssemblyState.PROJECTING ? (
                 <div className="space-y-8 animate-in slide-in-from-right-4 duration-700">
                    <div className="space-y-2">
                       <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Ready for Synthesis</h3>
                       <p className="text-slate-500">Initiate the Sovereign Forge to generate 0.001% elite grade specifications for this atomic unit.</p>
                    </div>
                    <button 
                      onClick={handleForge}
                      className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black uppercase tracking-[0.4em] text-xs transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-4"
                    >
                      Initialize Sovereign Forge
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20"/><path d="m17 17-5 5-5-5"/></svg>
                    </button>
                 </div>
               ) : state === AssemblyState.FORGING ? (
                 <div className="space-y-8 text-center py-20">
                    <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs font-mono text-blue-500 animate-pulse tracking-[0.5em] uppercase">Synthesizing Neural Directives...</p>
                 </div>
               ) : (
                 <div className="space-y-8 animate-in fade-in duration-1000">
                    <div className="p-8 bg-white/[0.02] border border-emerald-500/20 rounded-[2.5rem] space-y-6">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Elite Spec Delivered</span>
                          <span className="text-xl font-mono font-black text-white">{forgeSpec?.complianceScore}% GRADE</span>
                       </div>
                       <div className="space-y-4">
                          <div>
                             <span className="text-[9px] text-slate-600 uppercase font-black block mb-2">Bytecode Optimization</span>
                             <div className="text-xs font-mono text-slate-400 bg-black/40 p-4 rounded-xl border border-white/5">{forgeSpec?.bytecodeOptimization}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <span className="text-[9px] text-slate-600 uppercase font-black block mb-2">Latency Target</span>
                                <div className="text-lg font-mono font-black text-emerald-400">{forgeSpec?.latencyTargetNs}ns</div>
                             </div>
                             <div className="text-right">
                                <span className="text-[9px] text-slate-600 uppercase font-black block mb-2">Stability Invariants</span>
                                <div className="text-[10px] font-bold text-white uppercase">{forgeSpec?.safetyInvariants.length} Layers</div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-4">
                       <button onClick={() => setForgeSpec(null) || setState(AssemblyState.PROJECTING)} className="flex-1 py-5 border border-white/10 hover:bg-white/5 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Reject Logic</button>
                       <button 
                         onClick={handleCertify}
                         className="flex-[2] py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-xl shadow-emerald-500/20"
                       >
                         Certify Module & Commit
                       </button>
                    </div>
                 </div>
               )}
            </div>
          </div>
        )}

      </div>

      {/* Floating Cancel */}
      <button 
        onClick={onCancel}
        className="absolute top-12 right-12 p-4 bg-white/5 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  );
};

export default ModuleAssembler;
