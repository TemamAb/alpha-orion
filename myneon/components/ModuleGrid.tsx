
import React from 'react';
import { ModuleInfo, SpecialistAgent } from '../types';
import { SPECIALIST_AGENTS } from '../constants';
import Tooltip from './Tooltip';

interface Props {
  modules: ModuleInfo[];
  onBuild: (id: string) => void;
  onAudit: (id: string) => void;
  onTrainModule: (id: string) => void;
  onInvestigate: (id: string) => void;
  onOpenConsole: (id: string) => void;
  onForgeModule: (id: string) => void;
}

const ModuleGrid: React.FC<Props> = ({ modules, onBuild, onAudit, onTrainModule, onInvestigate, onOpenConsole, onForgeModule }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {modules.map(mod => {
        const dedicatedAgent = SPECIALIST_AGENTS.find(a => a.id === mod.dedicatedAgentId);
        
        // The Adaptive Pack: Evidence of Sovereign Dominance
        const adaptivePack = [
          { label: 'CL', active: mod.adaptiveFeatures.comparativeLogic, name: 'Comparative Logic' },
          { label: 'SS', active: mod.adaptiveFeatures.shadowSecurity, name: 'Shadow Security' },
          { label: 'EO', active: mod.adaptiveFeatures.elasticOptimization, name: 'Elastic Optimization' },
          { label: 'ET', active: mod.adaptiveFeatures.externalTelemetry, name: 'External Telemetry' },
          { label: 'SI', active: mod.adaptiveFeatures.synthesisIntelligence, name: 'Synthesis Intelligence' }
        ];
        
        const activeCount = adaptivePack.filter(s => s.active).length;
        const isSovereign = activeCount === 5;

        return (
          <div key={mod.id} className={`glass-heavy rounded-[3.5rem] p-12 border transition-all duration-700 group relative overflow-hidden flex flex-col h-full ${
            isSovereign ? 'border-[#D4AF37]/50 shadow-[0_0_80px_rgba(212,175,55,0.15)]' : 'border-white/5 hover:border-blue-500/30'
          }`}>
            <div className="absolute top-0 right-12 bg-black/40 px-6 py-3 border-x border-b border-white/10 rounded-b-2xl flex items-center gap-4 backdrop-blur-md z-10">
               <span className="text-xl">{dedicatedAgent?.icon}</span>
               <div className="flex flex-col leading-none">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Specialist Unit</span>
                  <span className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: dedicatedAgent?.color }}>{dedicatedAgent?.name}</span>
               </div>
            </div>

            <div className="flex justify-between items-start mb-10 relative z-10">
              <div>
                <div className="text-[9px] font-mono text-slate-700 mb-3 uppercase">Cluster Layer: {mod.tier}</div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                  {mod.name}
                  {isSovereign && <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse shadow-[0_0_12px_#D4AF37]"></div>}
                </h3>
              </div>
              
              <div className="flex gap-2 p-2 bg-black/40 rounded-2xl border border-white/5">
                {adaptivePack.map(seg => (
                  <Tooltip key={seg.label} content={`${seg.name}: ${seg.active ? 'SOVEREIGN' : 'INACTIVE'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all duration-500 ${
                      seg.active ? `bg-blue-600 text-white shadow-lg scale-110` : 'bg-white/5 text-slate-800 opacity-30'
                    }`}>
                      {seg.label}
                    </div>
                  </Tooltip>
                ))}
              </div>
            </div>

            <p className="text-sm text-slate-500 leading-relaxed font-medium mb-12 flex-grow italic relative z-10">
              "{mod.purpose}"
            </p>

            <div className="space-y-6 mb-12 relative z-10">
               <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Feature Cohesion</span>
                  <span className={`text-2xl font-mono font-black ${isSovereign ? 'text-[#D4AF37]' : 'text-slate-400'}`}>{activeCount}/5</span>
               </div>
               <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-white/5 p-0.5 flex gap-1.5">
                  {adaptivePack.map((seg, i) => (
                    <div 
                      key={i}
                      className={`h-full flex-1 transition-all duration-1000 rounded-full ${seg.active ? (isSovereign ? 'bg-[#D4AF37]' : 'bg-blue-500') : 'bg-white/[0.01]'}`}
                    ></div>
                  ))}
               </div>
            </div>

            <div className="flex items-center gap-4 pt-10 border-t border-white/5 mt-auto relative z-10">
              <button onClick={() => onTrainModule(mod.id)} className={`flex-1 py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 shadow-xl ${
                isSovereign ? 'bg-[#D4AF37] text-black hover:bg-[#C49F27]' : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}>
                {isSovereign ? 'Sovereign Sync Active' : 'Engage Optimization'}
              </button>
              
              <div className="flex gap-3">
                <Tooltip content="Analyze external industry traces for this module tier.">
                  <button onClick={() => onOpenConsole(mod.id)} className="p-5 glass rounded-2xl hover:bg-white/10 text-slate-400 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModuleGrid;
