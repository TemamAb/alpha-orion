
import React from 'react';
import { MeshIntelligenceState, AgentHandshake, SpecialistAgent } from '../types';

interface Props {
  state: MeshIntelligenceState;
  handshakes: AgentHandshake[];
  agents: SpecialistAgent[];
}

const MeshPulse: React.FC<Props> = ({ state, handshakes, agents }) => {
  const getAgentIcon = (id: string) => agents.find(a => a.id === id)?.icon || '🤖';
  const getAgentColor = (id: string) => agents.find(a => a.id === id)?.color || '#3b82f6';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-1000">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <div className="w-1.5 h-6 bg-purple-600 rounded-full"></div>
          Neural Pulse <span className="text-purple-500 font-mono text-[10px] border border-purple-500/30 px-2 py-0.5 rounded-full bg-purple-500/10 tracking-widest ml-2">IX-HUB</span>
        </h2>
      </div>

      {/* Synthesis Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl border border-purple-500/20 bg-purple-600/[0.03] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Global Cohesion</div>
          <div className="text-3xl font-mono font-black text-white">{state.globalCohesion}%</div>
          <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
             <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${state.globalCohesion}%` }}></div>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Feedback Loops</div>
          <div className="text-3xl font-mono font-black text-emerald-400">{state.activeLoops}</div>
          <div className="flex items-center gap-2 mt-3">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
             <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Mesh Stable</span>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
           <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Broker Insight</div>
           <p className="text-[10px] text-slate-400 font-medium italic leading-relaxed truncate-2-lines">
             "{state.lastBrokerSynthesis}"
           </p>
        </div>
      </div>

      {/* Handshake Feed */}
      <section>
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Live Handshake Stream</h3>
        <div className="space-y-3 h-[400px] overflow-y-auto custom-scrollbar pr-2">
           {handshakes.map((h, i) => (
             <div key={h.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-purple-500/20 transition-all group">
                <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center gap-3">
                      <div className="flex items-center -space-x-2">
                         <div className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center text-sm shadow-lg group-hover:scale-110 transition-transform" style={{ borderColor: getAgentColor(h.sourceAgentId) }}>
                           {getAgentIcon(h.sourceAgentId)}
                         </div>
                         <div className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center text-sm shadow-lg group-hover:scale-110 transition-transform" style={{ borderColor: getAgentColor(h.targetAgentId) }}>
                           {getAgentIcon(h.targetAgentId)}
                         </div>
                      </div>
                      <div>
                         <div className="text-[10px] font-black text-white uppercase tracking-tighter">Handshake #{h.id.split('-')[1]}</div>
                         <div className="text-[8px] text-slate-600 font-mono uppercase tracking-widest">{h.payloadType}</div>
                      </div>
                   </div>
                   <div className="text-[8px] text-slate-700 font-mono">
                     {new Date(h.timestamp).toLocaleTimeString()}
                   </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed italic group-hover:text-slate-200 transition-colors">
                  "{h.summary}"
                </p>
                <div className="mt-3 w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-purple-500/30 group-hover:bg-purple-500 transition-all duration-700" style={{ width: `${h.intensity * 100}%` }}></div>
                </div>
             </div>
           ))}
           <div className="py-10 text-center opacity-20">
              <span className="text-[8px] font-black uppercase tracking-[0.5em]">Broker End of Stream</span>
           </div>
        </div>
      </section>

      {/* Broker Directives */}
      <section className="p-6 bg-purple-600/5 border border-purple-500/20 rounded-[2rem]">
         <h3 className="text-[9px] font-black text-purple-400 uppercase tracking-[0.3em] mb-4">Neural Directives</h3>
         <div className="space-y-3">
            {state.brokerDirectives.map((dir, i) => (
              <div key={i} className="flex gap-3 items-start text-[10px] text-slate-400 group">
                 <span className="text-purple-600 font-mono font-black">0{i+1}</span>
                 <span className="group-hover:text-slate-200 transition-colors">{dir}</span>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
};

export default MeshPulse;
