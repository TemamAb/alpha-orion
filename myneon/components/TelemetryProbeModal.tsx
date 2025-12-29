
import React, { useState, useEffect } from 'react';
import { TelemetryStats, ModulePerformance } from '../types';
import Tooltip from './Tooltip';

interface Props {
  telemetry: TelemetryStats;
  onTriggerStress: () => void;
  onClose: () => void;
}

const TelemetryProbeModal: React.FC<Props> = ({ telemetry, onTriggerStress, onClose }) => {
  const isStress = telemetry.simulationState === 'STRESS_TESTING';

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/99 backdrop-blur-[120px]">
      <div className="glass w-full max-w-6xl h-[85vh] rounded-[4rem] overflow-hidden flex flex-col border border-cyan-500/40 shadow-[0_0_200px_rgba(6,182,212,0.15)] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
        
        {/* Header */}
        <div className="p-10 border-b border-white/10 flex justify-between items-center bg-cyan-900/10">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-cyan-600 rounded-[1.5rem] flex items-center justify-center shadow-[0_0_60px_rgba(6,182,212,0.4)] relative overflow-hidden group">
               <div className="absolute inset-0 bg-white/10 animate-pulse opacity-20"></div>
               <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">AI Telemetry Sentinel</h2>
              <div className="flex items-center gap-6 mt-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Sovereign Monitoring Layer v7.2-IX</span>
                <div className="px-4 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/30 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isStress ? 'bg-red-500 animate-ping' : 'bg-cyan-400 animate-pulse'}`}></div>
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">STATE: {telemetry.simulationState}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={onTriggerStress}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isStress ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10'}`}
             >
                {isStress ? 'STRESS ACTIVE' : 'Trigger Stress Simulation'}
             </button>
             <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all group">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-90 transition-transform"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
             </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-12 custom-scrollbar bg-[#010103] space-y-12">
          
          {/* Real-time Probes */}
          <section className="space-y-6">
            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.5em] flex items-center gap-4">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_#22d3ee]"></span>
              Active Module Probes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {telemetry.activePerformance?.map((perf, i) => (
                <div key={i} className={`p-8 rounded-[2.5rem] border transition-all relative overflow-hidden group ${isStress ? 'bg-red-500/[0.03] border-red-500/20' : 'bg-white/[0.02] border-white/5 hover:border-cyan-500/30'}`}>
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                     <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  </div>
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <div className="text-[9px] font-black text-cyan-500 uppercase tracking-widest mb-1">{perf.moduleId}</div>
                        <h4 className="text-lg font-black text-white uppercase tracking-widest">{perf.moduleName}</h4>
                     </div>
                     <div className="text-right">
                        <div className={`text-2xl font-mono font-black ${perf.resourceLoad > 70 ? 'text-red-500' : 'text-white'}`}>{perf.resourceLoad.toFixed(1)}%</div>
                        <div className="text-[7px] text-slate-700 font-black uppercase">CLUSTER LOAD</div>
                     </div>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-6">
                        <div>
                           <div className="text-[9px] text-slate-600 uppercase font-black mb-1">Execution Latency</div>
                           <div className="text-xl font-mono font-black text-cyan-400">{(perf.latencyNs / 1000).toFixed(2)} μs</div>
                        </div>
                        <div className="text-right">
                           <div className="text-[9px] text-slate-600 uppercase font-black mb-1">Throughput</div>
                           <div className="text-xl font-mono font-black text-emerald-400">{perf.throughputTps.toLocaleString()} <span className="text-[9px] font-normal opacity-50">TPS</span></div>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-8 pt-4 border-t border-white/5">
                        <div>
                           <div className="text-[9px] text-slate-600 uppercase font-black mb-1">Peak Jitter</div>
                           <div className={`text-sm font-mono font-bold ${perf.peakJitterNs > 2000 ? 'text-amber-500' : 'text-slate-400'}`}>±{(perf.peakJitterNs).toFixed(0)}ns</div>
                        </div>
                        <div className="text-right">
                           <div className="text-[9px] text-slate-600 uppercase font-black mb-1">Packet Loss</div>
                           <div className={`text-sm font-mono font-bold ${perf.packetLossRate > 0.01 ? 'text-red-500' : 'text-emerald-500'}`}>{(perf.packetLossRate * 100).toFixed(4)}%</div>
                        </div>
                     </div>
                  </div>

                  <div className="mt-6 flex items-center gap-2">
                     <div className={`w-1 h-1 rounded-full ${perf.resourceLoad > 80 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                     <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Early Health Signal: {perf.resourceLoad > 85 ? 'DEGRADED' : 'NOMINAL'}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Logic Wavefront */}
          <section className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] relative overflow-hidden group">
             <div className="absolute inset-0 bg-cyan-500/[0.01] pointer-events-none group-hover:bg-cyan-500/[0.02] transition-colors"></div>
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] mb-10 flex items-center gap-4">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                Neural Flux Wavefront
             </h3>
             <div className="h-48 flex items-end gap-1">
                {Array.from({ length: 120 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 transition-all duration-300 rounded-full ${isStress ? 'bg-red-500/40' : 'bg-cyan-500/40'}`}
                    style={{ 
                      height: `${Math.random() * (isStress ? 100 : 40) + 10}%`,
                      opacity: Math.random() * 0.5 + 0.5
                    }}
                  ></div>
                ))}
             </div>
             <div className="mt-6 flex justify-between text-[10px] font-mono text-slate-700 uppercase tracking-[0.2em]">
                <span>CORE_KERNEL_LOAD_PROBE</span>
                <span>DATA_AGGREGATOR_V3_HEARTBEAT</span>
             </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-10 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Aineonlite IX-TELEMETRY • SYNC: TRUE • LATENCY: 0.0004ms
          </div>
          <button 
            onClick={onClose}
            className="px-16 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-cyan-500/20 active:scale-95"
          >
            Confirm Telemetry Stream
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelemetryProbeModal;
