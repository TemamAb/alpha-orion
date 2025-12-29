
import React, { useMemo } from 'react';
import { LatencyReport } from '../types';
import Tooltip from './Tooltip';

interface Props {
  report: LatencyReport;
  onClose: () => void;
}

const LatencyConsoleModal: React.FC<Props> = ({ report, onClose }) => {
  const points = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      x: i * 20,
      y: 50 + (Math.sin(i * 0.8) * 15) + (Math.random() * 10)
    }));
  }, []);

  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[60px]">
      <div className="glass w-full max-w-5xl h-[85vh] rounded-[3rem] overflow-hidden flex flex-col border border-yellow-500/30 shadow-[0_0_150px_rgba(250,204,21,0.15)]">
        {/* Header */}
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-yellow-500/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500 animate-pulse"></div>
          <div className="flex items-center gap-8">
            <div className="p-4 bg-yellow-600 rounded-2xl shadow-xl shadow-yellow-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Latency Logic Hub</h2>
              <div className="flex items-center gap-6 mt-2">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Unit: Latency Wizard IX</span>
                <div className="px-4 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/30 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
                  <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Nano-Probe Active</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-10 bg-[#020204] custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Stats with Oscilloscope */}
            <div className="lg:col-span-12">
               <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-12 relative overflow-hidden">
                  <div className="absolute inset-0 bg-yellow-500/[0.01] pointer-events-none"></div>
                  
                  <div className="flex-1">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Total Execution Path</h3>
                    <Tooltip content="End-to-end nanosecond delay from mempool signal detection to on-chain bundle inclusion." position="right">
                      <div className="flex items-baseline gap-2 cursor-help">
                        <span className="text-6xl font-mono font-black text-white">{(report.overallLatencyNs / 1000000).toFixed(4)}</span>
                        <span className="text-xl font-bold text-yellow-500/50 uppercase">MS</span>
                      </div>
                    </Tooltip>
                    <p className="text-[10px] text-slate-600 font-mono mt-2 uppercase tracking-widest italic">Benchmark Target: &lt; 2.0000 ms</p>
                  </div>

                  {/* Simulated Oscilloscope */}
                  <Tooltip content="Real-time jitter variance across the mesh transport layer." position="left">
                    <div className="w-64 h-32 bg-black border border-white/10 rounded-2xl relative overflow-hidden p-2 group cursor-crosshair">
                      <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:10px_10px]"></div>
                      <svg viewBox="0 0 400 100" className="w-full h-full">
                        <path d={pathD} fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" className="animate-pulse">
                          <animate attributeName="d" dur="2s" repeatCount="indefinite" values={`${pathD}; M 0,60 L 40,40 L 80,70 L 120,30 L 160,80 L 200,50 L 240,60 L 280,40 L 320,70 L 360,30 L 400,60`} />
                        </path>
                      </svg>
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping"></div>
                        <span className="text-[8px] font-mono text-yellow-500 uppercase">Jitter Pulse</span>
                      </div>
                    </div>
                  </Tooltip>

                  <div className="text-right">
                    <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Node Topology Score</div>
                    <div className="text-5xl font-mono font-black text-emerald-400">{report.nodeTopologyScore}<span className="text-sm opacity-50">/100</span></div>
                  </div>
               </div>
            </div>

            {/* Hop Breakdown */}
            <div className="lg:col-span-8 space-y-8">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-4">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(250,204,21,0.5)]"></span>
                Nanosecond Hop Analysis
              </h3>
              <div className="space-y-4">
                {report.hopBreakdown.map((hop, i) => (
                  <Tooltip key={i} content={`Internal delay caused by ${hop.hop} processing.`} position="right">
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-yellow-500/20 transition-all group relative overflow-hidden cursor-help">
                      <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-yellow-500/5 to-transparent"></div>
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-mono text-slate-600">0{i+1}</span>
                          <h4 className="text-sm font-bold text-white uppercase tracking-tight">{hop.hop}</h4>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                          hop.status === 'Optimal' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {hop.status}
                        </span>
                      </div>
                      <div className="flex gap-12">
                         <div>
                           <div className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1">Duration</div>
                           <div className="text-lg font-mono font-black text-slate-200">{(hop.latencyNs).toLocaleString()} <span className="text-[10px] text-slate-600 font-normal">NS</span></div>
                         </div>
                         <div>
                           <div className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1">Jitter (δ)</div>
                           <div className="text-lg font-mono font-black text-yellow-500">±{(hop.jitterNs).toFixed(2)} <span className="text-[10px] text-slate-600 font-normal">NS</span></div>
                         </div>
                      </div>
                    </div>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Sidebar: Recommendations & Analysis */}
            <div className="lg:col-span-4 space-y-8">
              <section className="p-8 bg-yellow-500/5 border border-yellow-500/20 rounded-[2rem] h-fit">
                <h3 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.4em] mb-6">Wizard's Analysis</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium italic mb-8">
                  "{report.bottleneckAnalysis}"
                </p>
                <div className="space-y-4">
                   <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Optimization Directives</h4>
                   {report.optimizationRecommendations.map((rec, i) => (
                     <Tooltip key={i} content="Suggested structural change for better throughput." position="left">
                       <div className="flex gap-3 items-start p-3 bg-white/5 border border-white/5 rounded-xl text-[10px] text-slate-400 group hover:border-yellow-500/30 transition-all cursor-help">
                          <span className="text-yellow-500 font-bold font-mono group-hover:animate-ping">▸</span>
                          {rec}
                       </div>
                     </Tooltip>
                   ))}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Module: LATENCY-IX • UTC: {new Date(report.timestamp).toLocaleTimeString()}
          </div>
          <Tooltip content="Apply the calculated latency offsets to the engine's scheduling kernel." position="top">
            <button 
              onClick={onClose}
              className="px-16 py-4 bg-yellow-600 hover:bg-yellow-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_15px_40px_rgba(250,204,21,0.3)] hover:scale-[1.05] active:scale-95"
            >
              Commit Latency Optimized Params
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default LatencyConsoleModal;
