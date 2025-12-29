
import React from 'react';
import { ModuleTier } from '../types';
import Tooltip from './Tooltip';

const TierStrategyHub: React.FC = () => {
  const tiers = [
    {
      id: ModuleTier.SCANNER,
      title: 'Tier-1: Scanners',
      role: 'Signal Acquisition',
      responsibilities: [
        'Real-time Mempool Monitoring',
        'Cross-DEX Liquidity Sniffing',
        'Micro-latency Price Feed Ingestion',
        'Alpha Detection & Filtering'
      ],
      color: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
      tooltip: 'Scanners are responsible for low-latency market observation and signal extraction.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 6c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>
      )
    },
    {
      id: ModuleTier.CAPTAIN,
      title: 'Tier-2: Captains',
      role: 'Strategic Orchestration',
      responsibilities: [
        'Multi-Hop Pathfinding Logic',
        'Atomic Risk Validation',
        'Net ROI Yield Prediction',
        'Project Structural Management'
      ],
      color: 'border-blue-500/30 text-blue-400 bg-blue-500/5',
      tooltip: 'Captains handle pathfinding, risk management, and overall cluster synchronization.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20"/><path d="M4.93 4.93l14.14 14.14"/><path d="M2 12h20"/><path d="M19.07 4.93L4.93 19.07"/></svg>
      )
    },
    {
      id: ModuleTier.EXECUTOR,
      title: 'Tier-3: Executors',
      role: 'Atomic Settlement',
      responsibilities: [
        'Flash Loan Callback Execution',
        'Private Relay Bundle Submission',
        'Gas-Optimized Bytecode Delivery',
        'Profit-Check-or-Revert Guards'
      ],
      color: 'border-red-500/30 text-red-400 bg-red-500/5',
      tooltip: 'Executors handle the final settlement layer with high-frequency on-chain delivery.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {tiers.map((t) => (
        <div key={t.id} className={`glass p-6 rounded-3xl border transition-all hover:scale-[1.02] ${t.color}`}>
          <div className="flex items-center gap-4 mb-4">
            <Tooltip content={t.tooltip} position="right">
              <div className="p-2 bg-black/40 rounded-xl shadow-inner cursor-help">{t.icon}</div>
            </Tooltip>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest opacity-60">System Role</h4>
              <h3 className="text-sm font-bold uppercase tracking-tighter text-white">{t.role}</h3>
            </div>
          </div>
          <div className="h-px bg-white/5 mb-4"></div>
          <div className="space-y-3">
            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">Core Responsibilities</h5>
            {t.responsibilities.map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-[10px] font-mono mt-0.5 opacity-50">0{i + 1}</span>
                <p className="text-[11px] font-medium leading-tight text-slate-300">{r}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TierStrategyHub;
