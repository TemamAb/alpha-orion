
import React from 'react';
import { BotState, BotRole, BotStatus } from '../types';
import { Terminal, Shield, Activity } from 'lucide-react';

interface BotMonitorProps {
  bots: BotState[];
}

const BotMonitor: React.FC<BotMonitorProps> = ({ bots }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Execution Architecture</h2>
          <p className="text-slate-500 text-sm">Real-time status of the tri-tier bot system</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Cluster Synchronized</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {bots.map((bot) => (
          <BotCard key={bot.id} bot={bot} />
        ))}
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
          <Terminal size={18} className="text-emerald-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Live Execution Logs (Aggregated)</span>
        </div>
        <div className="p-6 h-64 overflow-y-auto bg-black/40 font-mono text-xs space-y-2 custom-scrollbar flex items-center justify-center">
          <p className="text-slate-600 uppercase tracking-widest font-bold">Execution Stream Initialized. Awaiting Events...</p>
        </div>
      </div>
    </div>
  );
};

const BotCard: React.FC<{ bot: BotState }> = ({ bot }) => (
  <div className="glass-panel p-6 rounded-2xl border-t-4 border-slate-800 hover:border-indigo-500/50 transition-all duration-300">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-3 rounded-xl ${bot.role === BotRole.ORCHESTRATOR ? 'bg-indigo-500/10 text-indigo-400' :
          bot.role === BotRole.SCANNER ? 'bg-emerald-500/10 text-emerald-400' :
            'bg-purple-500/10 text-purple-400'
        }`}>
        <Activity size={24} />
      </div>
      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${bot.status === BotStatus.EXECUTING ? 'bg-emerald-500/20 text-emerald-400' :
          bot.status === BotStatus.SCANNING ? 'bg-indigo-500/20 text-indigo-400' :
            'bg-slate-800 text-slate-400'
        }`}>
        {bot.status}
      </span>
    </div>

    <h3 className="text-xl font-bold mb-1">{bot.role}</h3>
    <p className="text-xs text-slate-500 mb-6">ID: {bot.id} | System Core v4.2</p>

    <div className="space-y-4">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">CPU Usage</span>
        <span className="font-bold">{bot.cpuUsage}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${bot.cpuUsage}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Uptime</p>
          <p className="text-sm font-mono">{Math.floor(bot.uptime / 60)}h {bot.uptime % 60}m</p>
        </div>
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Threat Level</p>
          <p className="text-sm text-emerald-400 font-bold">NOMINAL</p>
        </div>
      </div>
    </div>
  </div>
);

const LogLine: React.FC<{ time: string; bot: string; msg: string; color?: string }> = ({ time, bot, msg, color = 'text-slate-300' }) => (
  <div className="flex gap-4 hover:bg-slate-800/50 py-1 transition-colors group">
    <span className="text-slate-600 shrink-0 w-16">{time}</span>
    <span className="text-indigo-500 shrink-0 w-24 font-bold">[{bot}]</span>
    <span className={`${color} break-all`}>{msg}</span>
  </div>
);

export default BotMonitor;
