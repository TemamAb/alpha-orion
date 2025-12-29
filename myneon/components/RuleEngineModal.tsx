
import React from 'react';
import { RuleEngineReport } from '../types';
import Tooltip from './Tooltip';

interface Props {
  report: RuleEngineReport;
  onClose: () => void;
}

const RuleEngineModal: React.FC<Props> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/99 backdrop-blur-[120px]">
      <div className="glass w-full max-w-6xl h-[85vh] rounded-[4rem] overflow-hidden flex flex-col border border-blue-500/40 shadow-[0_0_200px_rgba(59,130,246,0.15)] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
        
        {/* Header */}
        <div className="p-10 border-b border-white/10 flex justify-between items-center bg-blue-900/10">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.4)] relative overflow-hidden group">
               <div className="absolute inset-0 bg-white/10 animate-pulse opacity-20"></div>
               <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">AI Rule & Enforcement Engine</h2>
              <div className="flex items-center gap-6 mt-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Signature: {report.engineSignature}</span>
                <div className="px-4 py-1 bg-blue-500/10 rounded-full border border-blue-500/30 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Enforcement Mode: {report.globalStrictnessScore > 0.7 ? 'STRICT' : 'ADAPTIVE'}</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all group">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-90 transition-transform"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-12 custom-scrollbar bg-[#010103] space-y-12">
          
          {/* Active Performance Telemetry Feed */}
          {report.telemetrySnapshot.activePerformance && (
            <section className="space-y-6">
              <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.5em] flex items-center gap-4">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></span>
                Live AI Telemetry Stream
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {report.telemetrySnapshot.activePerformance.map((perf, i) => (
                  <div key={i} className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                       <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    </div>
                    <div className="flex justify-between items-start mb-6">
                       <div>
                          <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Module: {perf.moduleId}</div>
                          <h4 className="text-lg font-black text-white uppercase tracking-widest">{perf.moduleName}</h4>
                       </div>
                       <div className="text-right">
                          <div className="text-2xl font-mono font-black text-white">{perf.resourceLoad.toFixed(1)}%</div>
                          <div className="text-[7px] text-slate-700 font-black uppercase">CORE LOAD</div>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-6">
                       <div>
                          <div className="text-[9px] text-slate-600 uppercase font-black mb-1">Latency</div>
                          <div className="text-xl font-mono font-black text-cyan-400">{(perf.latencyNs / 1000).toFixed(2)} μs</div>
                       </div>
                       <div className="text-right">
                          <div className="text-[9px] text-slate-600 uppercase font-black mb-1">Throughput</div>
                          <div className="text-xl font-mono font-black text-emerald-400">{perf.throughputTps.toLocaleString()} <span className="text-[9px] font-normal opacity-50">TPS</span></div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Strictness & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <section className="lg:col-span-4 p-8 bg-blue-500/5 border border-blue-500/20 rounded-[2.5rem] text-center">
               <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.4em] mb-6">Global Strictness</h3>
               <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                     <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="8" />
                     <circle 
                       cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="8" 
                       strokeDasharray={`${2 * Math.PI * 56}`}
                       strokeDashoffset={`${2 * Math.PI * 56 * (1 - report.globalStrictnessScore)}`}
                       className="text-blue-500 transition-all duration-1000"
                       strokeLinecap="round"
                     />
                  </svg>
                  <span className="absolute text-3xl font-mono font-black text-white">{(report.globalStrictnessScore * 100).toFixed(0)}%</span>
               </div>
               <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3 text-left">
                  <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Neural Insights</h4>
                  {report.performanceInsights.map((insight, i) => (
                    <div key={i} className="flex gap-3 text-[10px] text-slate-400 italic leading-relaxed">
                       <span className="text-blue-500">•</span>
                       {insight}
                    </div>
                  ))}
               </div>
            </section>

            <section className="lg:col-span-8 p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-8">Early Health Scoring Matrix</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.earlyHealthMatrix.map((score, i) => (
                    <Tooltip key={i} content={`Risk Factors: ${score.riskFactors.join(', ')}`} position="top">
                      <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center group cursor-help hover:border-blue-500/30 transition-all">
                         <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-black text-blue-500 uppercase mb-1 truncate">{score.moduleName}</div>
                            <div className="text-[8px] text-slate-600 font-mono">CONFIDENCE: {(score.confidenceInterval * 100).toFixed(0)}%</div>
                         </div>
                         <div className="text-right">
                            <div className={`text-xl font-mono font-black ${score.predictedScore >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{score.predictedScore}%</div>
                            <div className="text-[7px] text-slate-700 uppercase font-black">PREDICTED</div>
                         </div>
                      </div>
                    </Tooltip>
                  ))}
               </div>
            </section>
          </div>

          {/* Adaptive Threshold Rules */}
          <section className="space-y-8">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-4">
                <span className="w-10 h-px bg-blue-500/30"></span>
                Adaptive Threshold Enforcements
             </h3>
             <div className="grid grid-cols-1 gap-6">
                {report.adaptiveRules.map((rule, i) => (
                  <div key={i} className={`p-8 rounded-[2.5rem] border transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 ${
                    rule.severity === 'Strict' ? 'bg-red-500/5 border-red-500/30' : 'bg-white/[0.02] border-white/5'
                  }`}>
                    <div className="flex-grow space-y-4">
                       <div className="flex items-center gap-4">
                          <span className={`px-3 py-0.5 rounded text-[8px] font-black uppercase ${
                            rule.severity === 'Strict' ? 'bg-red-500 text-white' : 
                            rule.severity === 'Active' ? 'bg-blue-600 text-white' : 
                            'bg-slate-700 text-slate-300'
                          }`}>{rule.severity} RULE</span>
                          <h4 className="text-xl font-black text-white uppercase tracking-tighter">{rule.parameter}</h4>
                       </div>
                       <p className="text-xs text-slate-400 font-medium italic max-w-2xl leading-relaxed">
                          "{rule.reasoning}"
                       </p>
                    </div>
                    <div className="flex items-center gap-8 shrink-0 w-full lg:w-auto">
                       <div className="text-center px-6 border-r border-white/5">
                          <div className="text-[9px] font-black text-slate-700 uppercase mb-1">Baseline</div>
                          <div className="text-lg font-mono text-slate-500">{rule.currentThreshold}</div>
                       </div>
                       <div className="text-center px-6">
                          <div className="text-[9px] font-black text-blue-500 uppercase mb-1">Enforcement</div>
                          <div className="text-2xl font-mono font-black text-white">{rule.adjustment}</div>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-10 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Module: SENTINEL-RULE-IX • Logic: ADAPTIVE-THRESHOLD • Sync: {new Date(report.timestamp).toLocaleTimeString()}
          </div>
          <button 
            onClick={onClose}
            className="px-16 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-500/20 active:scale-95"
          >
            Acknowledge Rule Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default RuleEngineModal;
