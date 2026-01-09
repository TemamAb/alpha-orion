import React from 'react';
import { Shield, Lock, Eye, EyeOff, Zap, AlertTriangle, CheckCircle, Activity, TrendingDown, Clock } from 'lucide-react';
import type { MEVProtectionMetrics, TransactionSecurityAnalysis, MEVAttackDetection } from '../services/mevProtectionService';

/**
 * MEV SECURITY DISPLAY COMPONENT
 * 
 * Displays MEV attack protection, frontrunning prevention, and stealth metrics
 * as percentages for complete transparency.
 */

interface MEVSecurityDisplayProps {
  metrics: MEVProtectionMetrics;
  recentAnalyses: TransactionSecurityAnalysis[];
  recentAttacks: MEVAttackDetection[];
}

export const MEVSecurityDisplay: React.FC<MEVSecurityDisplayProps> = ({
  metrics,
  recentAnalyses,
  recentAttacks
}) => {
  const getScoreColor = (score: number): string => {
    if (score >= 95) return 'text-emerald-400';
    if (score >= 85) return 'text-indigo-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 95) return 'bg-emerald-500';
    if (score >= 85) return 'bg-indigo-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'LOW': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'MEDIUM': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'HIGH': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'CRITICAL': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Security Score */}
      <div className="glass-panel rounded-[1.5rem] border border-indigo-500/20 p-6 bg-gradient-to-br from-indigo-500/5 to-transparent">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                MEV Protection & Stealth Security
                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[8px] font-black text-indigo-400">
                  ACTIVE 24/7
                </span>
              </h3>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                Real-time Attack Prevention & Privacy Metrics
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <Activity size={14} className="text-emerald-400" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                Overall Security
              </span>
            </div>
            <div className={`text-3xl font-black tracking-tight ${getScoreColor(metrics.overallSecurityScore)}`}>
              {metrics.overallSecurityScore.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Main Security Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* MEV Protection Rate */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-indigo-400" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                MEV Protection
              </span>
            </div>
            <div className={`text-2xl font-black tracking-tight mb-2 ${getScoreColor(metrics.mevProtectionRate)}`}>
              {metrics.mevProtectionRate.toFixed(1)}%
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${getScoreBgColor(metrics.mevProtectionRate)}`}
                style={{ width: `${metrics.mevProtectionRate}%` }}
              />
            </div>
          </div>

          {/* Sandwich Attack Prevention */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-amber-400" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                Sandwich Prevention
              </span>
            </div>
            <div className={`text-2xl font-black tracking-tight mb-2 ${getScoreColor(metrics.sandwichAttackPrevention)}`}>
              {metrics.sandwichAttackPrevention.toFixed(1)}%
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${getScoreBgColor(metrics.sandwichAttackPrevention)}`}
                style={{ width: `${metrics.sandwichAttackPrevention}%` }}
              />
            </div>
          </div>

          {/* Frontrunning Protection */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown size={14} className="text-emerald-400" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                Frontrun Protection
              </span>
            </div>
            <div className={`text-2xl font-black tracking-tight mb-2 ${getScoreColor(metrics.frontrunningProtection)}`}>
              {metrics.frontrunningProtection.toFixed(1)}%
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${getScoreBgColor(metrics.frontrunningProtection)}`}
                style={{ width: `${metrics.frontrunningProtection}%` }}
              />
            </div>
          </div>

          {/* Backrunning Protection */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={14} className="text-cyan-400" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                Backrun Protection
              </span>
            </div>
            <div className={`text-2xl font-black tracking-tight mb-2 ${getScoreColor(metrics.backrunningProtection)}`}>
              {metrics.backrunningProtection.toFixed(1)}%
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${getScoreBgColor(metrics.backrunningProtection)}`}
                style={{ width: `${metrics.backrunningProtection}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stealth Metrics */}
      <div className="glass-panel rounded-[1.5rem] border border-purple-500/20 p-6 bg-gradient-to-br from-purple-500/5 to-transparent">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
            <EyeOff size={20} />
          </div>
          <div>
            <h4 className="text-md font-bold text-white uppercase tracking-tight">
              Stealth & Privacy Metrics
            </h4>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
              Transaction Privacy & Obfuscation Levels
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Transaction Privacy */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Lock size={14} className="text-purple-400" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                Transaction Privacy
              </span>
            </div>
            <div className={`text-2xl font-black tracking-tight mb-2 ${getScoreColor(metrics.transactionPrivacy)}`}>
              {metrics.transactionPrivacy.toFixed(1)}%
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 transition-all duration-1000"
                style={{ width: `${metrics.transactionPrivacy}%` }}
              />
            </div>
            <p className="text-[8px] text-slate-500 font-bold mt-2">
              Private relay + encryption active
            </p>
          </div>

          {/* Mempool Visibility (Lower is Better) */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Eye size={14} className="text-amber-400" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                Mempool Visibility
              </span>
            </div>
            <div className={`text-2xl font-black tracking-tight mb-2 ${
              metrics.mempoolVisibility <= 5 ? 'text-emerald-400' : 
              metrics.mempoolVisibility <= 20 ? 'text-indigo-400' : 'text-rose-400'
            }`}>
              {metrics.mempoolVisibility.toFixed(1)}%
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  metrics.mempoolVisibility <= 5 ? 'bg-emerald-500' : 
                  metrics.mempoolVisibility <= 20 ? 'bg-indigo-500' : 'bg-rose-500'
                }`}
                style={{ width: `${metrics.mempoolVisibility}%` }}
              />
            </div>
            <p className="text-[8px] text-slate-500 font-bold mt-2">
              Lower = more stealth
            </p>
          </div>

          {/* Route Obfuscation */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={14} className="text-cyan-400" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                Route Obfuscation
              </span>
            </div>
            <div className={`text-2xl font-black tracking-tight mb-2 ${getScoreColor(metrics.routeObfuscation)}`}>
              {metrics.routeObfuscation.toFixed(1)}%
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-500 transition-all duration-1000"
                style={{ width: `${metrics.routeObfuscation}%` }}
              />
            </div>
            <p className="text-[8px] text-slate-500 font-bold mt-2">
              Multi-hop + randomization
            </p>
          </div>
        </div>
      </div>

      {/* Protection Methods & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Protection Methods */}
        <div className="glass-panel rounded-[1.5rem] border border-white/5 p-6">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">
            Active Protection Methods
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-slate-300">Flashbots Private Relay</span>
              </div>
              <span className={`px-2 py-1 rounded text-[8px] font-black ${
                metrics.flashbotsEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400'
              }`}>
                {metrics.flashbotsEnabled ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-slate-300">Private Relay Network</span>
              </div>
              <span className={`px-2 py-1 rounded text-[8px] font-black ${
                metrics.privateRelayEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400'
              }`}>
                {metrics.privateRelayEnabled ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-slate-300">Gas Optimization</span>
              </div>
              <span className={`px-2 py-1 rounded text-[8px] font-black ${
                metrics.gasOptimizationEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400'
              }`}>
                {metrics.gasOptimizationEnabled ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-slate-300">Slippage Protection (0.5%)</span>
              </div>
              <span className={`px-2 py-1 rounded text-[8px] font-black ${
                metrics.slippageProtectionEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400'
              }`}>
                {metrics.slippageProtectionEnabled ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Protection Statistics */}
        <div className="glass-panel rounded-[1.5rem] border border-white/5 p-6">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">
            Protection Statistics
          </h4>
          <div className="space-y-4">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={12} className="text-emerald-400" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                  Attacks Blocked (24h)
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-400 tracking-tight">
                {metrics.attacksBlocked24h}
              </div>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={12} className="text-indigo-400" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                  Loss Prevented (24h)
                </span>
              </div>
              <div className="text-2xl font-black text-indigo-400 tracking-tight">
                {metrics.potentialLossPrevented}
              </div>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={12} className="text-cyan-400" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                  Protection Latency
                </span>
              </div>
              <div className="text-2xl font-black text-cyan-400 tracking-tight">
                {metrics.averageProtectionLatency}ms
              </div>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={12} className="text-purple-400" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                  Protection Uptime
                </span>
              </div>
              <div className="text-2xl font-black text-purple-400 tracking-tight">
                {metrics.protectionUptime.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Security Analyses */}
      {recentAnalyses.length > 0 && (
        <div className="glass-panel rounded-[1.5rem] border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
              Recent Transaction Security Analyses
            </h4>
          </div>
          <div className="divide-y divide-white/5">
            {recentAnalyses.slice(0, 5).map((analysis) => (
              <div key={analysis.txHash} className="p-4 hover:bg-white/[0.01] transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-mono text-slate-400 truncate">
                        {analysis.txHash}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[9px]">
                      <div>
                        <span className="text-slate-600 font-bold uppercase block mb-0.5">
                          Security Score
                        </span>
                        <span className={`font-black ${getScoreColor(analysis.securityScore)}`}>
                          {analysis.securityScore}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 font-bold uppercase block mb-0.5">
                          MEV Risk
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black ${getRiskColor(analysis.mevRisk)}`}>
                          {analysis.mevRisk}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 font-bold uppercase block mb-0.5">
                          Frontrun Risk
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black ${getRiskColor(analysis.frontrunRisk)}`}>
                          {analysis.frontrunRisk}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 font-bold uppercase block mb-0.5">
                          Savings
                        </span>
                        <span className="text-emerald-400 font-black">
                          {analysis.estimatedSavings}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Attacks Blocked */}
      {recentAttacks.length > 0 && (
        <div className="glass-panel rounded-[1.5rem] border border-rose-500/20 overflow-hidden bg-gradient-to-br from-rose-500/5 to-transparent">
          <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
              Recent Attacks Blocked
            </h4>
            <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-black text-emerald-400">
              {recentAttacks.length} BLOCKED
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {recentAttacks.slice(0, 5).map((attack, index) => (
              <div key={index} className="p-4 hover:bg-white/[0.01] transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={16} className="text-rose-400" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-white uppercase">
                          {attack.attackType} Attack
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black ${getRiskColor(attack.severity)}`}>
                          {attack.severity}
                        </span>
                      </div>
                      <p className="text-[8px] text-slate-500 font-bold">
                        Loss Prevented: {attack.potentialLoss}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-black text-emerald-400">
                    BLOCKED ✓
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MEVSecurityDisplay;
