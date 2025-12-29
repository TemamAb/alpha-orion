
import React from 'react';
import { GaslessRelayResult } from '../types';
import Tooltip from './Tooltip';

interface Props {
  result: GaslessRelayResult;
  onClose: () => void;
}

const GaslessRelayModal: React.FC<Props> = ({ result, onClose }) => {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/99 backdrop-blur-[120px]">
      <div className="glass w-full max-w-5xl h-[85vh] rounded-[4rem] overflow-hidden flex flex-col border border-purple-500/40 shadow-[0_0_250px_rgba(168,85,247,0.2)] relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse"></div>
        
        {/* Spectral Header */}
        <div className="p-12 text-center space-y-4">
           <div className="w-24 h-24 bg-purple-600 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-[0_0_80px_rgba(168,85,247,0.6)] relative group">
              <div className="absolute inset-0 bg-white/20 animate-ping opacity-20"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
           </div>
           <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
              Ghost <span className="text-purple-400">Relay Console</span>
           </h1>
           <p className="text-[10px] text-purple-500/60 font-black uppercase tracking-[0.8em]">AineonliteIX Stealth Submission Protocol</p>
        </div>

        <div className="flex-grow overflow-y-auto p-12 custom-scrollbar bg-[#010103] space-y-16">
          
          {/* Main Stealth Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <section className="p-10 bg-purple-500/5 border border-purple-500/20 rounded-[3rem] text-center relative group overflow-hidden">
                <div className="absolute inset-0 bg-purple-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="text-xs font-black text-purple-400 uppercase tracking-[0.4em] mb-8">Inclusion Probability</h3>
                <div className="text-8xl font-black text-white tracking-tighter">{(result.miningProbability * 100).toFixed(0)}%</div>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-4">Weighted Network Inclusion</p>
             </section>

             <section className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] text-center flex flex-col justify-center">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-8">Stealth Level</h3>
                <div className="text-6xl font-black text-purple-400 tracking-tighter mb-4 uppercase">{result.stealthLevel}-GRADE</div>
                <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Mempool Masking Active</span>
                </div>
             </section>
          </div>

          {/* Bidding & Savings Matrix */}
          <section className="space-y-10">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-4">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]"></span>
                Neural Bidding Matrix
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 bg-black/40 border border-white/5 rounded-3xl group hover:border-purple-500/30 transition-all">
                   <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Priority Gas Bid</div>
                   <div className="text-3xl font-mono font-black text-white">{result.estimatedPriorityFeeGwei} <span className="text-sm text-slate-500">GWEI</span></div>
                </div>
                <div className="p-8 bg-black/40 border border-white/5 rounded-3xl group hover:border-purple-500/30 transition-all">
                   <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Estimated Block</div>
                   <div className="text-3xl font-mono font-black text-white">#{result.targetBlock}</div>
                </div>
                <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl group">
                   <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2">Private Bundle Savings</div>
                   <div className="text-3xl font-mono font-black text-emerald-400">+${result.gasSavingsUsd.toFixed(2)}</div>
                </div>
             </div>
          </section>

          {/* Builder Node Registry */}
          <section className="space-y-8">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-4">
                <span className="w-10 h-px bg-purple-500/30"></span>
                Mesh Relay Distribution
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.relayNodes.map((node, i) => (
                  <div key={i} className="flex justify-between items-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl group hover:bg-white/[0.04] transition-all cursor-help">
                     <div className="flex items-center gap-4">
                        <span className="text-xs font-mono text-purple-900 group-hover:text-purple-500 transition-colors">0{i+1}</span>
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-tight">{node}</span>
                     </div>
                     <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest animate-pulse">Handshake verified</span>
                     </div>
                  </div>
                ))}
             </div>
          </section>

          {/* Bundle ID Seal */}
          <section className="p-12 bg-black rounded-[4rem] border border-white/10 relative overflow-hidden group">
             <div className="absolute inset-0 bg-purple-500/[0.02] animate-pulse"></div>
             <div className="flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
                <div className="space-y-4 flex-1">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Cryptographic Bundle Fingerprint</h3>
                   <div className="text-xs font-mono text-purple-400 break-all bg-purple-500/5 p-6 rounded-3xl border border-purple-500/20 shadow-inner">
                     {result.bundleId}
                   </div>
                </div>
                <div className="text-right shrink-0">
                   <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Protocol Status</div>
                   <div className={`text-4xl font-black ${result.submissionStatus === 'Pending' ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                     {result.submissionStatus}
                   </div>
                   <div className="text-[8px] text-slate-700 uppercase font-black tracking-widest mt-2">Verified by Relay Ghost IX</div>
                </div>
             </div>
          </section>
        </div>

        {/* Action Footer */}
        <div className="p-12 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            STEALTH SYNC: {new Date(result.timestamp).getTime()} • BUILDER MESH: ACTIVE
          </div>
          <div className="flex gap-4">
             <button onClick={onClose} className="px-10 py-5 bg-white/5 hover:bg-white/10 text-slate-500 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all">Cancel Submission</button>
             <Tooltip content="Officially authorize the Ghost-Relay bundle submission to the private builder network.">
                <button 
                  onClick={onClose}
                  className="px-20 py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.4em] transition-all shadow-[0_20px_60px_rgba(168,85,247,0.4)] active:scale-95 flex items-center gap-4 group"
                >
                  Initiate Stealth Submission
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
             </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GaslessRelayModal;
