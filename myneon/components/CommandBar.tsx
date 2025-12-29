
import React from 'react';
import Tooltip from './Tooltip';
import { BrandingConfig } from '../types';

interface Props {
  telemetry: {
    switches: number;
    errors: number;
    riskScore: number;
  };
  branding: BrandingConfig;
}

const CommandBar: React.FC<Props> = ({ telemetry, branding }) => {
  const protocols = [
    { id: 1, label: 'BNIP', name: 'Blockchain Native', status: 'ACTIVE', color: 'text-blue-400' },
    { id: 2, label: 'EGV', name: 'Elite Benchmark', status: 'VERIFIED', color: 'text-purple-400' },
    { id: 3, label: 'EVP', name: 'Etherscan Profit', status: 'SYNCED', color: 'text-emerald-400' },
    { id: 4, label: 'SWARM', name: 'Neural Auto-Sync', status: 'AUTONOMOUS', color: 'text-blue-400' }
  ];

  return (
    <div className="glass-heavy w-full px-10 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 z-[100] backdrop-blur-3xl">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={branding.isWhiteLabeled ? { backgroundColor: branding.primaryColor } : {}}></div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">System Mesh Online</span>
        </div>
        
        <div className="h-4 w-px bg-white/5"></div>
        
        <div className="flex items-center gap-8">
          {protocols.map(p => (
            <Tooltip key={p.id} content={`Protocol ${p.id}: ${p.name} - Status: ${p.status}`} position="bottom">
              <div className="flex items-center gap-3 group cursor-help">
                <div className={`text-[9px] font-black px-2 py-0.5 rounded border border-white/10 ${p.color} bg-white/5`} style={branding.isWhiteLabeled && p.id === 1 ? { color: branding.primaryColor } : {}}>{p.label}</div>
                <div className={`w-1.5 h-1.5 rounded-full ${p.id === 4 ? 'bg-blue-400 animate-ping' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`}></div>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-12">
        <div className="flex items-center gap-8">
          <div>
            <div className="text-[8px] font-black text-slate-600 uppercase mb-1">Global Risk Score</div>
            <div className="text-sm font-mono font-bold text-white">{(telemetry.riskScore * 100).toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-[8px] font-black text-slate-600 uppercase mb-1">Mesh Switches</div>
            <div className="text-sm font-mono font-bold text-white">{telemetry.switches}</div>
          </div>
          <div>
            <div className="text-[8px] font-black text-slate-600 uppercase mb-1">Latency Layer</div>
            <div className="text-sm font-mono font-bold text-emerald-400" style={branding.isWhiteLabeled ? { color: branding.primaryColor } : {}}>1.4ms</div>
          </div>
        </div>
        
        <div className="px-6 py-2 bg-blue-600/10 border border-blue-500/30 rounded-xl flex items-center gap-3" style={branding.isWhiteLabeled ? { backgroundColor: `${branding.primaryColor}22`, borderColor: `${branding.primaryColor}55` } : {}}>
          <div className="text-[9px] font-black text-blue-500 tracking-widest leading-none" style={branding.isWhiteLabeled ? { color: branding.primaryColor } : {}}>
             {branding.brandName}<br/><span className="text-white opacity-50 uppercase">{branding.isWhiteLabeled ? 'TENANT-MESH' : 'PRO-CORE'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandBar;
