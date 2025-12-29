
import React, { useMemo } from 'react';
import { TelemetryStats, MeshEvent } from '../types';

interface Props {
  telemetry: TelemetryStats;
  events: MeshEvent[];
}

const QualityTrendChart: React.FC<Props> = ({ telemetry, events }) => {
  // Extract a trend from events (using the "model" events or just sampling riskScore over time)
  // Since we don't have historical telemetry in the current props, we'll simulate a path 
  // based on the current riskScore and event count to show 'evolution'
  const points = useMemo(() => {
    const p = [];
    const count = Math.max(10, events.length);
    const base = telemetry.riskScore;
    
    for (let i = 0; i <= 10; i++) {
      // Simulate some historical variance leading to the current value
      const variance = (Math.sin(i * 0.8) * 0.05) + (Math.random() * 0.02);
      const val = Math.max(0.01, base + (variance * (10 - i) / 10));
      p.push({ x: i * 30, y: 80 - (val * 100 * 0.8) });
    }
    return p;
  }, [telemetry.riskScore, events.length]);

  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;

  return (
    <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Model Evolution</h3>
          <p className="text-[10px] text-slate-600 font-mono mt-1">Global Quality Trend (IX-Adaptive)</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-mono font-bold text-blue-400">{(100 - telemetry.riskScore * 100).toFixed(1)}%</div>
          <div className="text-[9px] text-slate-500 uppercase font-black">Integrity Score</div>
        </div>
      </div>

      <div className="h-24 w-full relative">
        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 80">
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.2)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
            </linearGradient>
          </defs>
          
          {/* Fill Area */}
          <path
            d={`${pathD} L 300,80 L 0,80 Z`}
            fill="url(#chartGradient)"
          />
          
          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
          />
          
          {/* End Point */}
          <circle 
            cx={points[points.length-1].x} 
            cy={points[points.length-1].y} 
            r="3" 
            fill="#3b82f6" 
            className="animate-pulse"
          />
        </svg>
      </div>

      <div className="mt-4 flex justify-between text-[9px] font-mono text-slate-700 uppercase tracking-tighter">
        <span>T-Minus 10 Clusters</span>
        <span>Real-Time Optimization Baseline</span>
      </div>
    </div>
  );
};

export default QualityTrendChart;
