
import React, { useMemo } from 'react';
import { ModuleInfo, CertLevel } from '../types';

interface Props {
  modules: ModuleInfo[];
}

const EngineReadiness: React.FC<Props> = ({ modules }) => {
  const stats = useMemo(() => {
    const totalModules = modules.length;
    const certified = modules.filter(m => m.certLevel !== CertLevel.UNCERTIFIED).length;
    const integrated = modules.filter(m => m.isIntegrated).length;
    const averageScore = modules.reduce((acc, m) => acc + (m.score || 0), 0) / totalModules;
    
    // Readiness calculation based on integration and certification
    const readinessScore = (integrated / totalModules * 60) + (certified / totalModules * 40);
    
    return {
      readiness: Math.min(100, readinessScore),
      certifiedCount: certified,
      integratedCount: integrated,
      avgScore: averageScore
    };
  }, [modules]);

  const getReadinessLabel = () => {
    if (stats.readiness >= 100) return { text: 'SOVEREIGN GRADE ENGINE', color: 'text-cyan-400' };
    if (stats.readiness > 80) return { text: 'ELITE TRINITY READY', color: 'text-blue-400' };
    if (stats.readiness > 50) return { text: 'ADVANCED CLUSTER', color: 'text-emerald-400' };
    return { text: 'PROTOCOL HANDSHAKE', color: 'text-slate-500' };
  };

  const label = getReadinessLabel();

  return (
    <div className="glass p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-r from-blue-500/[0.03] to-purple-500/[0.03] mb-8 relative overflow-hidden group">
      <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
        <div className="flex-1 space-y-4 w-full">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-1">Trinity Alignment Metric</span>
              <h3 className={`text-2xl font-black uppercase tracking-tighter ${label.color}`}>{label.text}</h3>
            </div>
            <div className="text-right">
              <span className="text-5xl font-mono font-black text-white">{stats.readiness.toFixed(1)}%</span>
            </div>
          </div>
          <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 p-1">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 transition-all duration-1500 relative rounded-full"
              style={{ width: `${stats.readiness}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 w-full md:w-auto shrink-0 px-8 border-l border-white/5">
          <div className="text-center md:text-left">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-1">Forged Units</span>
            <span className="text-2xl font-mono font-black text-emerald-400">{stats.integratedCount}/{modules.length}</span>
          </div>
          <div className="text-center md:text-left">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-1">Certified</span>
            <span className="text-2xl font-mono font-black text-blue-500">{stats.certifiedCount}</span>
          </div>
          <div className="text-center md:text-left">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-1">Trinity Sync</span>
            <span className="text-2xl font-mono font-black text-purple-400">{stats.readiness === 100 ? 'YES' : 'NO'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngineReadiness;
