import React, { useState, useMemo } from 'react';
import { Strategy } from '../types';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Filter, 
  Layers, 
  Zap, 
  CheckCircle2, 
  Circle, 
  Target, 
  HelpCircle,
  History,
  AlertTriangle,
  BrainCircuit,
  TrendingUp,
  ChevronDown,
  Network,
  ArrowLeftRight,
  Database,
  Lock,
  ArrowDownCircle,
  Activity,
  BarChart3
} from 'lucide-react';

interface StrategyForgeProps {
  strategies: Strategy[];
}

const Tooltip: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="group relative inline-block ml-1.5 align-middle">
    <HelpCircle size={11} className="text-slate-600 hover:text-indigo-400 cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block w-72 p-3 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-[999] pointer-events-none ring-1 ring-white/5">
      <div className="text-[10px] font-bold text-indigo-400 capitalize tracking-tight mb-1">{title}</div>
      <div className="text-[11px] leading-relaxed text-slate-300 font-medium lowercase first-letter:uppercase">{children}</div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
    </div>
  </div>
);

const StrategyForge: React.FC<StrategyForgeProps> = ({ strategies }) => {
  const [selectedProviders, setSelectedProviders] = useState<string[]>(['Aave', 'Uniswap', 'Balancer']);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'queued'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleProvider = (provider: string) => {
    setSelectedProviders(prev => 
      prev.includes(provider) ? prev.filter(p => p !== provider) : [...prev, provider]
    );
  };

  const filteredStrategies = useMemo(() => {
    return strategies.filter(strategy => {
      const providerMatch = selectedProviders.includes(strategy.liquidityProvider);
      const statusMatch = statusFilter === 'all' ? true : statusFilter === 'active' ? strategy.active : !strategy.active;
      return providerMatch && statusMatch;
    });
  }, [strategies, selectedProviders, statusFilter]);

  return (
    <div className="space-y-8 pt-4 pb-20">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-bold mb-1 tracking-tight text-white">Alpha Forge</h2>
          <p className="text-slate-500 text-sm font-medium">Forging top-tier arbitrage routes from millions of data points</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 shadow-sm">
          <Sparkles className="text-indigo-400" size={18} />
          <span className="text-sm font-bold text-indigo-300">Dynamic Optimizer 2.5 Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-xl">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <Filter size={14} /> Advanced Filters
            </h3>
            <div className="mb-8">
              <h4 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">Liquidity Source</h4>
              <div className="space-y-2">
                {['Aave', 'Uniswap', 'Balancer'].map(provider => (
                  <button
                    key={provider}
                    onClick={() => toggleProvider(provider)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      selectedProviders.includes(provider)
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-inner'
                        : 'bg-slate-900/50 border-white/5 text-slate-500 hover:border-white/10'
                    }`}
                  >
                    <span className="text-sm font-bold">{provider}</span>
                    {selectedProviders.includes(provider) ? <CheckCircle2 size={16} /> : <Circle size={16} className="opacity-20" />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">Execution Status</h4>
              <div className="flex p-1 bg-slate-900/80 rounded-xl border border-white/5">
                {(['all', 'active', 'queued'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                      statusFilter === status ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-4">
          {filteredStrategies.map((strategy) => (
            <StrategyRow 
              key={strategy.id} 
              strategy={strategy} 
              isExpanded={expandedId === strategy.id}
              onToggle={() => setExpandedId(expandedId === strategy.id ? null : strategy.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const StrategyRow: React.FC<{ strategy: Strategy, isExpanded: boolean, onToggle: () => void }> = ({ strategy, isExpanded, onToggle }) => {
  const details = useMemo(() => ({
    historical: [
      { label: 'Avg Cycle Profit', value: `+$${(Math.random() * 500 + 100).toFixed(2)}` },
      { label: 'Success Rate', value: `${(85 + Math.random() * 14).toFixed(1)}%` },
      { label: 'Alpha Decay', value: `${(Math.random() * 0.5 + 0.1).toFixed(2)}% / week` },
      { label: 'Execution Speed', value: `${(Math.random() * 15 + 10).toFixed(1)}ms` },
    ],
    risks: [
      { name: 'Execution Slippage', level: Math.floor(Math.random() * 40) + 10 },
      { name: 'Mempool Competition', level: Math.floor(Math.random() * 30) + 5 },
      { name: 'Oracle Latency', level: Math.floor(Math.random() * 20) + 2 },
    ],
    aiInsight: `This cluster exhibits ${strategy.score > 80 ? 'high' : 'moderate'} synchronization with the current L2 heartbeat. Pimlico sponsorship reduces breakeven by 14%.`
  }), [strategy]);

  return (
    <div className={`glass-panel rounded-3xl border-l-4 transition-all duration-500 overflow-hidden ${
      strategy.active ? 'border-emerald-500/50' : 'border-slate-800'
    } ${isExpanded ? 'bg-indigo-500/[0.04] shadow-xl border-indigo-500/40' : 'hover:bg-white/[0.01]'}`}>
      <div className="p-6 flex items-center justify-between cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isExpanded ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
            {isExpanded ? <Target size={32} /> : <ShieldCheck size={32} />}
          </div>
          <div>
            <h4 className={`text-sm font-bold ${isExpanded ? 'text-indigo-400' : 'text-white'}`}>{strategy.name}</h4>
            <div className="flex items-center gap-4 text-[10px] mt-2 font-black uppercase tracking-widest">
              <span className="text-slate-500">{strategy.liquidityProvider}</span>
              {strategy.gasSponsorship && <span className="text-emerald-500 flex items-center gap-1"><Zap size={10} /> GASLESS</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-10">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-black">ROI</p>
            <p className="text-xs font-bold text-emerald-400">+{strategy.roi}%</p>
          </div>
          <ChevronDown className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-400' : 'text-slate-600'}`} />
        </div>
      </div>

      {isExpanded && (
        <div className="p-8 border-t border-white/5 space-y-8 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase"><History size={14} /> Metrics</div>
              {details.historical.map((h, i) => (
                <div key={i} className="flex justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px]">
                  <span className="text-slate-400">{h.label}</span>
                  <span className="text-white font-bold">{h.value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase"><AlertTriangle size={14} /> Risk</div>
              {details.risks.map((r, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-500"><span>{r.name}</span><span>{r.level}%</span></div>
                  <div className="w-full h-1 bg-slate-800 rounded-full"><div className="bg-indigo-500 h-full" style={{ width: `${r.level}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase"><BrainCircuit size={14} /> AI Insight</div>
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[11px] italic text-slate-300 leading-relaxed">"{details.aiInsight}"</div>
            </div>
          </div>
          <div className="pt-4 border-t border-white/5 flex justify-between items-center">
            <div className="flex gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><BarChart3 size={14} /> Block Priority: Top Tier</div>
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-colors">Force Execute</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyForge;