
import React from 'react';
import { OpportunityReport } from '../types';
import Tooltip from './Tooltip';

interface Props {
  report: OpportunityReport;
  onClose: () => void;
}

const OpportunityConsoleModal: React.FC<Props> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 z-[280] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[100px]">
      <div className="glass w-full max-w-6xl h-[90vh] rounded-[4rem] overflow-hidden flex flex-col border border-yellow-500/40 shadow-[0_0_200px_rgba(250,204,21,0.15)]">
        
        {/* Header */}
        <div className="p-10 border-b border-white/10 flex justify-between items-center bg-yellow-600/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent animate-pulse"></div>
          <div className="flex items-center gap-8">
            <div className="p-5 bg-yellow-600 rounded-[2rem] shadow-2xl shadow-yellow-500/40 relative group">
              <div className="absolute inset-0 bg-white/20 animate-ping rounded-[2rem] opacity-20"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 10V6"/><path d="M12 14v4"/><path d="M10 12H6"/><path d="M18 12h-4"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Opportunity Radar IX</h2>
              <div className="flex items-center gap-6 mt-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Agent: Opportunity Analyzer IX</span>
                <div className="px-4 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/30 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Alpha Stream Verified</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all group">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-90 transition-transform"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow flex overflow-hidden bg-[#020205]">
          <div className="flex-grow p-12 overflow-y-auto custom-scrollbar space-y-12">
            
            {/* Top Protocols: Thresholds & Waves */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <section className="p-8 bg-yellow-500/5 border border-yellow-500/20 rounded-[2.5rem]">
                  <h3 className="text-xs font-black text-yellow-500 uppercase tracking-[0.4em] mb-8">Threshold Tuning Protocol</h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <span>Min Spread Floor</span>
                          <span className="text-yellow-400">{(report.thresholdProtocol.minSpreadFloor * 100).toFixed(2)}%</span>
                       </div>
                       <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-yellow-500" style={{ width: `${report.thresholdProtocol.minSpreadFloor * 500}%` }}></div>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <Tooltip content="The gas multiplier required to ensure atomic inclusion in the next block." position="top">
                        <div className="flex-1 p-4 bg-white/[0.02] border border-white/5 rounded-2xl cursor-help">
                            <div className="text-[8px] font-black text-slate-600 uppercase mb-1">Gas Premium</div>
                            <div className="text-lg font-mono font-black text-white">+{report.thresholdProtocol.gasAdjustedPremium} GWEI</div>
                        </div>
                       </Tooltip>
                       <Tooltip content="Depth factor calculates liquidity density to predict slippage on large flash loan volumes." position="top">
                        <div className="flex-1 p-4 bg-white/[0.02] border border-white/5 rounded-2xl cursor-help">
                            <div className="text-[8px] font-black text-slate-600 uppercase mb-1">Depth Factor</div>
                            <div className="text-lg font-mono font-black text-white">{report.thresholdProtocol.liquidityDepthFactor}x</div>
                        </div>
                       </Tooltip>
                    </div>
                  </div>
               </section>

               <section className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Volatility Wave Filter</h3>
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${report.volatilityFilter.waveFilteringStatus === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500'}`}>
                      {report.volatilityFilter.waveFilteringStatus}
                    </div>
                  </div>
                  <div className="flex items-center gap-8 mb-8">
                     <Tooltip content="Global index of non-toxic volatility. Higher values indicate healthier arbitrage conditions." position="bottom">
                       <div className="relative w-20 h-20 flex items-center justify-center shrink-0 cursor-help">
                          <svg className="w-full h-full -rotate-90">
                             <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                             <circle 
                               cx="40" cy="40" r="36" fill="none" stroke="#facc15" strokeWidth="4" 
                               strokeDasharray={`${2 * Math.PI * 36}`}
                               strokeDashoffset={`${2 * Math.PI * 36 * (1 - report.volatilityFilter.globalIndex)}`}
                               strokeLinecap="round"
                             />
                          </svg>
                          <span className="absolute text-sm font-mono font-black text-white">{(report.volatilityFilter.globalIndex * 100).toFixed(0)}%</span>
                       </div>
                     </Tooltip>
                     <div>
                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Global Market Noise</div>
                        <div className="text-xs font-bold text-emerald-400 uppercase">Status: {report.volatilityFilter.riskAdjustment}</div>
                     </div>
                  </div>
               </section>
            </div>

            {/* Opportunities List with Statistical Insets */}
            <section className="space-y-8">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-4">
                <span className="w-10 h-px bg-yellow-500/30"></span>
                Alpha Vectors: Statistical Engine
              </h3>
              <div className="grid grid-cols-1 gap-8">
                {report.opportunities.map((opp, i) => (
                  <div key={i} className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:border-yellow-500/30 transition-all group flex flex-col gap-10">
                    
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                      <div className="space-y-4">
                         <div className="flex items-center gap-3">
                            <span className="text-[9px] font-mono text-slate-700 uppercase">VECTOR: {opp.id}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${
                              opp.volatilityStatus === 'Stable' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>{opp.volatilityStatus}</span>
                         </div>
                         <h4 className="text-3xl font-black text-white uppercase tracking-tighter">{opp.pair}</h4>
                         <div className="flex items-center gap-4">
                            {opp.path.map((step, si) => (
                              <React.Fragment key={si}>
                                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{step}</span>
                                 {si < opp.path.length - 1 && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="3"><path d="m9 18 6-6-6-6"/></svg>}
                              </React.Fragment>
                            ))}
                         </div>
                      </div>

                      <div className="flex items-center gap-16 w-full lg:w-auto border-t lg:border-t-0 border-white/5 pt-8 lg:pt-0">
                         <div className="text-right">
                            <div className="text-[9px] text-slate-600 uppercase font-black mb-1">Gross Spread</div>
                            <div className="text-3xl font-mono font-black text-yellow-400">+{opp.spread.toFixed(2)}%</div>
                         </div>
                         <div className="text-right">
                            <div className="text-[9px] text-slate-600 uppercase font-black mb-1">Est. Profit</div>
                            <div className="text-3xl font-mono font-black text-white">${opp.estimatedProfitUsd.toLocaleString()}</div>
                         </div>
                      </div>
                    </div>

                    {/* Statistical Breakdown Section */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-6 border-t border-white/5">
                       <Tooltip content="Z-Score > 2.0 indicates a statistically significant spread unlikely to be noise." position="top">
                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 cursor-help">
                            <div className="text-[8px] font-black text-slate-700 uppercase mb-1">Z-Score</div>
                            <div className={`text-lg font-mono font-black ${opp.stats.zScore > 2 ? 'text-emerald-400' : 'text-white'}`}>{opp.stats.zScore.toFixed(2)}</div>
                        </div>
                       </Tooltip>
                       <Tooltip content="The probability that the current spread will revert to the mean within 2 blocks." position="top">
                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 cursor-help">
                            <div className="text-[8px] font-black text-slate-700 uppercase mb-1">Reversion Prob.</div>
                            <div className="text-lg font-mono font-black text-white">{(opp.stats.meanReversionProbability * 100).toFixed(1)}%</div>
                        </div>
                       </Tooltip>
                       <Tooltip content="Price deviation over the last 100 blocks for this DEX pair." position="top">
                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 cursor-help">
                            <div className="text-[8px] font-black text-slate-700 uppercase mb-1">Std. Deviation</div>
                            <div className="text-lg font-mono font-black text-slate-400">{opp.stats.standardDeviation.toFixed(4)}</div>
                        </div>
                       </Tooltip>
                       <Tooltip content="Factor identifying high-frequency market buy/sell waves." position="top">
                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 cursor-help">
                            <div className="text-[8px] font-black text-slate-700 uppercase mb-1">Wave Factor</div>
                            <div className="text-lg font-mono font-black text-blue-400">{opp.stats.volatilityWaveFactor.toFixed(3)}</div>
                        </div>
                       </Tooltip>
                       <Tooltip content="Where this spread ranks compared to all arbitrage opportunities in the last 24 hours." position="top">
                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 cursor-help">
                            <div className="text-[8px] font-black text-slate-700 uppercase mb-1">Historical Rank</div>
                            <div className="text-lg font-mono font-black text-purple-400">{opp.stats.historicalPercentile.toFixed(1)}%</div>
                        </div>
                       </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            AstraElite Opportunity Hub • Sync: {new Date(report.timestamp).toLocaleTimeString()}
          </div>
          <Tooltip content="Inject the verified alpha vectors directly into the engine's execution queue." position="top">
            <button 
              onClick={onClose}
              className="px-16 py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-yellow-500/20 active:scale-95"
            >
              Authorize Strategy Injection
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default OpportunityConsoleModal;
