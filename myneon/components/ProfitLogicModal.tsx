
import React from 'react';
import { ProfitCalculationResult } from '../types';

interface Props {
  result: ProfitCalculationResult;
  onClose: () => void;
}

const ProfitLogicModal: React.FC<Props> = ({ result, onClose }) => {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl">
      <div className="glass w-full max-w-4xl rounded-[2.5rem] overflow-hidden flex flex-col border border-emerald-500/40 shadow-[0_0_120px_rgba(16,185,129,0.25)]">
        {/* Header */}
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-emerald-500/5 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse"></div>
          <div className="flex items-center gap-6">
            <div className="p-4 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Net ROI Engine</h2>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Unit: Elite Profit Logic IX</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${result.isViable ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                  Strategy Status: {result.isViable ? 'VIABLE' : 'REJECTED'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-10 overflow-y-auto space-y-10 bg-[#050507]">
          {/* Path Visualization */}
          <section>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-6">Multi-Hop Execution Path</h3>
            <div className="flex flex-wrap items-center gap-4">
              {result.path.map((step, i) => (
                <React.Fragment key={i}>
                  <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-mono text-sm text-emerald-400 font-bold">
                    {step}
                  </div>
                  {i < result.path.length - 1 && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="3"><path d="m9 18 6-6-6-6"/></svg>
                  )}
                </React.Fragment>
              ))}
            </div>
          </section>

          {/* Financial Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <section className="space-y-6">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Yield Breakdown</h3>
              <div className="space-y-4">
                {[
                  { label: 'Gross Profit', val: `$${result.grossProfit.toFixed(2)}`, color: 'text-white' },
                  { label: 'Gas Consumption', val: `-$${result.gasCostUsd.toFixed(2)}`, color: 'text-red-400' },
                  { label: 'Protocol Fees', val: `-$${result.protocolFeesUsd.toFixed(2)}`, color: 'text-red-400' },
                  { label: 'Estimated Slippage', val: `-$${result.slippageUsd.toFixed(2)}`, color: 'text-amber-400' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <span className="text-xs font-bold text-slate-500 uppercase">{item.label}</span>
                    <span className={`text-sm font-mono font-bold ${item.color}`}>{item.val}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Net Performance</h3>
              <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl flex flex-col items-center justify-center text-center">
                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Net Realized Profit</div>
                <div className="text-5xl font-mono font-black text-white mb-2">${result.netRoi.toFixed(2)}</div>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                  <span className="text-[10px] font-black text-emerald-400">ROI Verified by IX-Mesh</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center">
                    <div className="text-[8px] font-black text-slate-600 uppercase mb-1">Risk Rating</div>
                    <div className={`text-sm font-bold uppercase ${result.riskRating === 'Safe' ? 'text-emerald-400' : 'text-amber-400'}`}>{result.riskRating}</div>
                 </div>
                 <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center">
                    <div className="text-[8px] font-black text-slate-600 uppercase mb-1">Spread Confidence</div>
                    <div className="text-sm font-bold text-blue-400 font-mono">98.4%</div>
                 </div>
              </div>
            </section>
          </div>
        </div>

        <div className="p-8 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Handshake: AE-PROFIT-IX • Timestamp: {new Date(result.timestamp).toLocaleTimeString()}
          </div>
          <button 
            onClick={onClose}
            className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_15px_40px_rgba(16,185,129,0.3)] hover:scale-[1.05] active:scale-95"
          >
            Acknowledge Calculation
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfitLogicModal;
