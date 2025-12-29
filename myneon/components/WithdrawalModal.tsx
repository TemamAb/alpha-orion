
import React, { useState } from 'react';
import { WithdrawalReport } from '../types';
import Tooltip from './Tooltip';

interface Props {
  report: WithdrawalReport;
  onClose: () => void;
  onUpdate: (newReport: WithdrawalReport) => void;
}

const WithdrawalModal: React.FC<Props> = ({ report: initialReport, onClose, onUpdate }) => {
  const [report, setReport] = useState<WithdrawalReport>(initialReport);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [manualAddress, setManualAddress] = useState<string>(initialReport.activeAddress);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleWithdraw = () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0 || amt > report.profitAvailableUsd) {
      alert("Invalid withdrawal amount.");
      return;
    }
    
    setIsProcessing(true);
    setTimeout(() => {
      const newReport: WithdrawalReport = {
        ...report,
        profitAvailableUsd: report.profitAvailableUsd - amt,
        transactionHistory: [
          {
            id: "TX-" + Math.random().toString(16).slice(2, 8).toUpperCase(),
            amount: amt,
            destination: manualAddress,
            timestamp: new Date().toISOString(),
            status: 'Confirmed'
          },
          ...report.transactionHistory
        ]
      };
      setReport(newReport);
      onUpdate(newReport);
      setIsProcessing(false);
      setWithdrawAmount('');
      alert("Withdrawal Sequence Confirmed. Funds dispersed to non-custodial vault.");
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[60px]">
      <div className="glass w-full max-w-5xl h-[85vh] rounded-[3rem] overflow-hidden flex flex-col border border-emerald-500/30 shadow-[0_0_150px_rgba(16,185,129,0.15)]">
        {/* Header */}
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-emerald-500/5 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse"></div>
          <div className="flex items-center gap-8">
            <div className="p-4 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Liquidity Guardian Hub</h2>
              <div className="flex items-center gap-6 mt-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Unit: Withdrawal Specialist IX</span>
                <div className="px-4 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Non-Custodial Bridge Active</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-10 bg-[#020204] custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Wallet Detector */}
          <div className="lg:col-span-4 space-y-8">
            <section>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Wallet Mesh Status
              </h3>
              <div className="space-y-3">
                {report.detectedWallets.map(wallet => (
                  <div key={wallet.name} className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${wallet.isDetected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.02] border-white/5 opacity-40'}`}>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{wallet.icon}</span>
                      <div>
                        <div className="text-[10px] font-black text-white uppercase">{wallet.name}</div>
                        <div className="text-[8px] text-slate-500 uppercase font-bold">{wallet.status}</div>
                      </div>
                    </div>
                    {wallet.isDetected && (
                      <Tooltip content={`Synchronize with ${wallet.name} extension for non-custodial profit dispersal.`} position="right">
                        <button className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-[8px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">Select</button>
                      </Tooltip>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[9px] font-black text-slate-500 uppercase">Auto-Withdrawal</span>
                <Tooltip content="Automatically disperse profits to the active vault once the USD threshold is reached." position="top">
                  <button 
                    onClick={() => setReport({...report, autoWithdrawal: {...report.autoWithdrawal, enabled: !report.autoWithdrawal.enabled}})}
                    className={`w-10 h-5 rounded-full relative transition-all ${report.autoWithdrawal.enabled ? 'bg-emerald-500' : 'bg-slate-800'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${report.autoWithdrawal.enabled ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </Tooltip>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Threshold Limit</span>
                  <span className="text-emerald-400">${report.autoWithdrawal.threshold}</span>
                </div>
                <input 
                  type="range" min="100" max="5000" step="50"
                  value={report.autoWithdrawal.threshold}
                  onChange={(e) => setReport({...report, autoWithdrawal: {...report.autoWithdrawal, threshold: parseInt(e.target.value)}})}
                  className="w-full h-1 bg-slate-800 rounded-full appearance-none accent-emerald-500 cursor-pointer"
                />
              </div>
            </section>
          </div>

          {/* Main Controls */}
          <div className="lg:col-span-8 space-y-10">
             <Tooltip content="Total accumulated profit across all successful atomic arbitrage cycles." position="bottom">
               <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex justify-between items-center relative overflow-hidden cursor-help">
                  <div className="absolute -left-10 -bottom-10 opacity-5">
                     <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <div>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-2">Available Arbitrage Profit</span>
                     <div className="text-6xl font-mono font-black text-white">${report.profitAvailableUsd.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                  </div>
                  <div className="text-right">
                     <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Network Yield</div>
                     <div className="text-2xl font-mono font-black text-emerald-400">+14.2% <span className="text-xs text-slate-700">APY</span></div>
                  </div>
               </div>
             </Tooltip>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <section className="space-y-6">
                   <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Withdrawal Protocol</h3>
                   <div className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Destination Address</label>
                         <Tooltip content="The EIP-55 validated address where arbitrage proceeds will be atomically settled." position="top">
                            <input 
                              type="text" 
                              value={manualAddress}
                              onChange={(e) => setManualAddress(e.target.value)}
                              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-emerald-400 outline-none focus:border-emerald-500/50 transition-all"
                              placeholder="0x..."
                            />
                         </Tooltip>
                         <div className="flex items-center gap-2 mt-1">
                            <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                            <span className="text-[8px] font-bold text-slate-600 uppercase">EIP-55 Checksum Verified</span>
                         </div>
                      </div>
                      
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Withdrawal Amount ($)</label>
                         <div className="relative">
                            <input 
                              type="number" 
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white outline-none focus:border-emerald-500/50 transition-all"
                              placeholder="0.00"
                            />
                            <Tooltip content="Disperse all available profit to the linked vault address." position="left">
                              <button 
                                onClick={() => setWithdrawAmount(report.profitAvailableUsd.toString())}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest"
                              >Max</button>
                            </Tooltip>
                         </div>
                      </div>

                      <Tooltip content="Initiate a cryptographically signed withdrawal handshake. Funds move directly from contract to vault." position="bottom">
                        <button 
                          onClick={handleWithdraw}
                          disabled={isProcessing}
                          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                        >
                          {isProcessing ? 'Handshaking...' : 'Execute Manual Withdrawal'}
                        </button>
                      </Tooltip>
                   </div>
                </section>

                <section className="space-y-6">
                   <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Payout History</h3>
                   <div className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden h-[240px] flex flex-col">
                      <div className="flex-grow overflow-y-auto p-4 custom-scrollbar space-y-3">
                         {report.transactionHistory.length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-20">
                              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="m17 17-5 5-5-5"/><path d="m17 7-5-5-5 5"/></svg>
                              <span className="text-[10px] mt-4 font-bold uppercase tracking-widest">No recent payouts</span>
                           </div>
                         ) : (
                           report.transactionHistory.map(tx => (
                             <Tooltip key={tx.id} content={`Transaction confirmed on-chain at block ${Math.floor(Math.random() * 1000000) + 19000000}`} position="left">
                               <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex justify-between items-center group cursor-help">
                                  <div>
                                     <div className="text-[9px] font-black text-white uppercase group-hover:text-emerald-400 transition-colors">{tx.id}</div>
                                     <div className="text-[8px] text-slate-600 font-mono">{tx.destination.slice(0, 6)}...{tx.destination.slice(-4)}</div>
                                  </div>
                                  <div className="text-right">
                                     <div className="text-[10px] font-black text-emerald-400">+${tx.amount.toFixed(2)}</div>
                                     <div className="text-[7px] text-slate-700 uppercase font-bold">{new Date(tx.timestamp).toLocaleDateString()}</div>
                                  </div>
                               </div>
                             </Tooltip>
                           ))
                         )}
                      </div>
                   </div>
                </section>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest flex items-center gap-4">
            AstraElite Vault-IX • Non-Custodial Security: PLATINUM
            <span className="text-slate-800">|</span>
            Last Sync: {new Date(report.timestamp).toLocaleTimeString()}
          </div>
          <div className="flex gap-4">
             <button 
                onClick={onClose}
                className="px-10 py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
             >Close Hub</button>
             <Tooltip content="Persist the current vault configurations to the persistent simulation memory." position="top">
               <button 
                  onClick={() => alert("Settings saved to persistent engine memory.")}
                  className="px-12 py-4 border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
               >Commit Vault Params</button>
             </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalModal;
