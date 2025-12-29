
import React, { useState } from 'react';
import { MEVProtectionReport } from '../types';
import { triggerHardeningCycle } from '../services/securityService';
import Tooltip from './Tooltip';

interface Props {
  report: MEVProtectionReport;
  onClose: () => void;
  onUpdate?: (report: MEVProtectionReport) => void;
}

const SecuritySentinelModal: React.FC<Props> = ({ report, onClose, onUpdate }) => {
  const [isHardening, setIsHardening] = useState<string | null>(null);

  const handleHarden = async (target: string) => {
    setIsHardening(target);
    const updated = await triggerHardeningCycle(report, target);
    if (onUpdate) onUpdate(updated);
    setIsHardening(null);
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[80px]">
      <div className="glass w-full max-w-5xl h-[85vh] rounded-[3rem] overflow-hidden flex flex-col border border-red-500/30 shadow-[0_0_150px_rgba(239,68,68,0.2)]">
        {/* Header */}
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-red-500/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
          <div className="flex items-center gap-8">
            <div className="p-4 bg-red-600 rounded-2xl shadow-xl shadow-red-500/30 group">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="group-hover:scale-110 transition-transform"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Security Sentinel Hub</h2>
              <div className="flex items-center gap-6 mt-2">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Unit: Security Sentinel IX</span>
                <div className="px-4 py-1 bg-red-500/10 rounded-full border border-red-500/30 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Anti-MEV Shield ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white group">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-90 transition-transform"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-10 bg-[#020204] custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Shield Strength & Radar */}
            <div className="lg:col-span-12">
               <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-12 relative overflow-hidden">
                  <div className="absolute inset-0 bg-red-500/[0.01] pointer-events-none"></div>
                  
                  <div className="flex items-center gap-10 flex-1">
                    <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                      <div className="absolute inset-0 border border-red-500/20 rounded-full animate-[spin_4s_linear_infinite]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1/2 bg-gradient-to-b from-red-500 to-transparent"></div>
                      </div>
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(239,68,68,0.1)" strokeWidth="10" />
                        <circle 
                          cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="10" 
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - report.shieldStrength / 100)}`}
                          className="text-red-500 transition-all duration-1000"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-3xl font-black text-red-500">{report.shieldStrength}%</span>
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Tactical Shield Hardening</h3>
                      <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                        Real-time defensive posture against mempool extraction. Integrated with private relays to bypass adversarial searchers.
                      </p>
                      <div className="mt-6 flex gap-3">
                        <Tooltip content="Rotate between encrypted private RPC nodes to eliminate IP-level tracking by adversarial sandwich bots." position="top">
                          <button 
                            onClick={() => handleHarden('RPC Node Rotation')}
                            disabled={isHardening !== null}
                            className="px-4 py-2 bg-red-600/10 border border-red-500/30 rounded-xl text-[9px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                          >
                            {isHardening === 'RPC Node Rotation' ? 'Rotating...' : 'Rotate RPC Nodes'}
                          </button>
                        </Tooltip>
                        <Tooltip content="Configure direct builder submission via Flashbots/Beaver to bypass the public mempool entirely." position="top">
                          <button 
                            onClick={() => handleHarden('Ghost-Relay Pathing')}
                            disabled={isHardening !== null}
                            className="px-4 py-2 bg-red-600/10 border border-red-500/30 rounded-xl text-[9px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                          >
                            {isHardening === 'Ghost-Relay Pathing' ? 'Hardening...' : 'Enable Ghost-Relay'}
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Defensive Status</div>
                    <div className={`text-2xl font-black uppercase ${report.isCompromised ? 'text-red-500' : 'text-emerald-400'}`}>
                      {report.isCompromised ? 'COMPROMISED' : 'NOMINAL'}
                    </div>
                    <div className="text-[9px] text-slate-600 font-mono mt-2 uppercase tracking-widest italic">
                      RPC Signal: SHA-256 ENCRYPTED
                    </div>
                  </div>
               </div>
            </div>

            {/* Threat Vector Analysis */}
            <div className="lg:col-span-8 space-y-8">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-4">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                Threat Vector Simulation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {report.threatVectors.map((vector, i) => (
                  <Tooltip key={i} content={`Defensive protocol: ${vector.mitigationStrategy}`} position="right">
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-red-500/20 transition-all group relative overflow-hidden h-full">
                      <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-red-500/5 to-transparent"></div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">{vector.type}</h4>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                          vector.riskLevel === 'Critical' ? 'bg-red-500 text-white' : 
                          vector.riskLevel === 'High' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {vector.riskLevel} Risk
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-4 h-12 overflow-hidden leading-relaxed">{vector.mitigationStrategy}</p>
                      <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <span className="text-[10px] text-slate-500 uppercase font-black">Detection Probability</span>
                        <span className="text-sm font-mono font-bold text-emerald-400">{(vector.detectionProbability * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Sidebar: Defenses & Tactical Logs */}
            <div className="lg:col-span-4 space-y-8">
              <section className="p-8 bg-red-500/5 border border-red-500/20 rounded-[2rem] h-fit">
                <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-6">Active Countermeasures</h3>
                <div className="space-y-4">
                   {report.activeDefenses.map((def, i) => (
                     <Tooltip key={i} content="Active real-time invariant monitoring for this protocol." position="left">
                       <div className="flex gap-3 items-center p-3 bg-white/5 border border-white/5 rounded-xl text-[10px] text-slate-300 font-bold uppercase tracking-wider group hover:border-emerald-500/30 transition-all cursor-help">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:animate-ping"></span>
                          {def}
                       </div>
                     </Tooltip>
                   ))}
                </div>
              </section>

              <section className="bg-black/60 rounded-[2rem] p-8 border border-white/10">
                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-6">Tactical Log Feed</h3>
                <div className="space-y-2 font-mono text-[10px] max-h-[200px] overflow-y-auto custom-scrollbar">
                  {report.simulationLogs.map((log, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-red-900">{(i+1).toString().padStart(2, '0')}</span>
                      <span className="text-red-400/60 leading-relaxed">{log}</span>
                    </div>
                  ))}
                  <div className="pt-2 flex items-center gap-2 text-red-500/20">
                    <span className="animate-pulse">_</span>
                    <span>MONITORING...</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Module: SENTINEL-IX • ID: SEC-{Math.random().toString(16).slice(2, 10).toUpperCase()} • UTC: {new Date(report.timestamp).toLocaleTimeString()}
          </div>
          <Tooltip content="Commit the current defensive configuration to the production engine kernel." position="top">
            <button 
              onClick={onClose}
              className="px-16 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_15px_40px_rgba(239,68,68,0.3)] hover:scale-[1.05] active:scale-95"
            >
              Commit Defensive Hardening
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default SecuritySentinelModal;
