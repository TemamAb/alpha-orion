
import React, { useMemo, useEffect, useState } from 'react';
import { MeshEvent, CertLevel, ModuleInfo, ModuleTier } from '../types';

interface Node {
  id: string;
  x: number;
  y: number;
  color: string;
  tier: ModuleTier;
  label: string;
}

const NODES: Node[] = [
  // TIER 1: Left (Scanners)
  { id: 'Scanner-1', x: 80, y: 80, color: '#f59e0b', tier: ModuleTier.SCANNER, label: 'Mempool' },
  { id: 'Scanner-2', x: 80, y: 180, color: '#f59e0b', tier: ModuleTier.SCANNER, label: 'DEX Feed' },
  
  // TIER 2: Center (Captain Tier)
  { id: 'Captain-1', x: 300, y: 60, color: '#3b82f6', tier: ModuleTier.CAPTAIN, label: 'Kernel' },
  { id: 'Captain-2', x: 300, y: 130, color: '#10b981', tier: ModuleTier.CAPTAIN, label: 'Strategy' },
  { id: 'Captain-3', x: 300, y: 200, color: '#a855f7', tier: ModuleTier.CAPTAIN, label: 'Security' },
  
  // TIER 3: Right (Executors)
  { id: 'Executor-1', x: 520, y: 80, color: '#ef4444', tier: ModuleTier.EXECUTOR, label: 'Atomic' },
  { id: 'Executor-2', x: 520, y: 180, color: '#ec4899', tier: ModuleTier.EXECUTOR, label: 'Relay' }
];

// Added missing Props interface
interface Props {
  events: MeshEvent[];
  modules: ModuleInfo[];
}

const MeshVisualizer: React.FC<Props> = ({ events, modules }) => {
  const [activeEdges, setActiveEdges] = useState<{ id: string; source: Node; target: Node; timestamp: number }[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (events.length === 0) return;
    const latest = events[events.length - 1];
    
    // Simulate real flow: Scanners often ping Captains, Captains ping Executors
    let sourceNode = NODES.find(n => n.id === latest.source);
    let targetNode = NODES.find(n => n.id === latest.target);

    // Fallback logic for random events to keep visuals alive
    if (!sourceNode) sourceNode = NODES[Math.floor(Math.random() * NODES.length)];
    if (!targetNode) targetNode = NODES[Math.floor(Math.random() * NODES.length)];

    const edgeId = `${latest.id}-${Date.now()}`;
    setActiveEdges(prev => [...prev.slice(-12), { id: edgeId, source: sourceNode!, target: targetNode!, timestamp: Date.now() }]);
    
    const timer = setTimeout(() => {
      setActiveEdges(prev => prev.filter(e => e.id !== edgeId));
    }, 1500);
    return () => clearTimeout(timer);
  }, [events]);

  return (
    <div className="glass p-8 rounded-[2.5rem] relative overflow-hidden h-[450px] border border-white/5 shadow-2xl bg-gradient-to-br from-[#020204] to-blue-900/10 group/viz">
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.4em] text-slate-400 group-hover/viz:text-blue-400 transition-colors">Neural Mesh Topology</h3>
          <p className="text-[10px] text-slate-600 font-mono mt-1 uppercase tracking-widest">Active Tri-Tier Coordination Layer</p>
        </div>
        <div className="flex gap-3">
          {Object.values(ModuleTier).map(tier => (
            <div key={tier as string} className="flex items-center gap-2">
              {/* Fixed: Cast tier to string to access includes/split methods */}
              <div className={`w-1.5 h-1.5 rounded-full ${(tier as string).includes('Scanner') ? 'bg-amber-500' : (tier as string).includes('Captain') ? 'bg-blue-500' : (tier as string).includes('Executor') ? 'bg-red-500' : 'bg-slate-500'}`}></div>
              <span className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">
                {(tier as string).split(': ')[1]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <svg viewBox="0 0 600 260" className="w-full h-full drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <defs>
          <filter id="glow-mesh" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
          <filter id="node-outer-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur"/>
            <feComponentTransfer in="blur">
                <feFuncA type="linear" slope="0.6"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="white" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Dynamic Scanlines */}
        <line x1="190" y1="20" x2="190" y2="240" stroke="rgba(59, 130, 246, 0.05)" strokeDasharray="4 4" />
        <line x1="410" y1="20" x2="410" y2="240" stroke="rgba(59, 130, 246, 0.05)" strokeDasharray="4 4" />

        {/* Active Flow Edges */}
        {activeEdges.map(edge => (
          <g key={edge.id}>
            <path
              d={`M ${edge.source.x} ${edge.source.y} Q ${(edge.source.x + edge.target.x)/2} ${(edge.source.y + edge.target.y)/2 - 30} ${edge.target.x} ${edge.target.y}`}
              fill="none"
              stroke={edge.source.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              className="opacity-30"
            />
            <path
              d={`M ${edge.source.x} ${edge.source.y} Q ${(edge.source.x + edge.target.x)/2} ${(edge.source.y + edge.target.y)/2 - 30} ${edge.target.x} ${edge.target.y}`}
              fill="none"
              stroke="url(#edge-grad)"
              strokeWidth="1.5"
              strokeDasharray="10 20"
              className="opacity-60"
            >
              <animate attributeName="stroke-dashoffset" from="100" to="0" dur="0.8s" repeatCount="indefinite" />
            </path>
          </g>
        ))}

        {/* Nodes Cluster */}
        {NODES.map(node => {
          const latestEvent = events[events.length - 1];
          const isActive = latestEvent?.source === node.id || latestEvent?.target === node.id;
          const isHovered = hoveredNode === node.id;
          
          return (
            <g 
              key={node.id} 
              className="cursor-pointer transition-all duration-300"
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Pulsing Aura for Active/Hovered Nodes */}
              {(isActive || isHovered) && (
                <g>
                  <circle 
                    cx={node.x} cy={node.y} r={isHovered ? 35 : 28} 
                    fill="none" 
                    stroke={node.color} 
                    strokeWidth="1" 
                    className="opacity-20 animate-ping" 
                  />
                  <circle 
                    cx={node.x} cy={node.y} r={isHovered ? 30 : 25} 
                    fill={node.color} 
                    className="opacity-[0.05]" 
                    filter="url(#node-outer-glow)"
                  />
                </g>
              )}

              {/* Main Outer Ring */}
              <circle
                cx={node.x} cy={node.y} r="20"
                fill="#050508"
                stroke={node.color}
                strokeWidth={isHovered ? "2.5" : isActive ? "2" : "1"}
                strokeDasharray={isActive ? "0" : "3 3"}
                className={`transition-all duration-300 ${isActive ? 'animate-pulse' : 'opacity-60'}`}
              />

              {/* Holographic Crosshairs for Hovered Node */}
              {isHovered && (
                <g className="opacity-40 animate-spin" style={{ transformOrigin: `${node.x}px ${node.y}px`, animationDuration: '8s' }}>
                  <path d={`M ${node.x - 25} ${node.y} L ${node.x - 22} ${node.y}`} stroke={node.color} strokeWidth="1"/>
                  <path d={`M ${node.x + 25} ${node.y} L ${node.x + 22} ${node.y}`} stroke={node.color} strokeWidth="1"/>
                  <path d={`M ${node.x} ${node.y - 25} L ${node.x} ${node.y - 22}`} stroke={node.color} strokeWidth="1"/>
                  <path d={`M ${node.x} ${node.y + 25} L ${node.x} ${node.y + 22}`} stroke={node.color} strokeWidth="1"/>
                </g>
              )}

              {/* Core Node Dot */}
              <circle 
                cx={node.x} cy={node.y} r={isHovered ? "6" : "4"} 
                fill={node.color} 
                filter="url(#glow-mesh)"
                className="transition-all duration-300"
              />

              {/* Labels & Meta */}
              <g className={`transition-all duration-300 pointer-events-none ${isHovered ? 'translate-y-[-5px]' : ''}`}>
                <text 
                  x={node.x} y={node.y + 35} 
                  textAnchor="middle" 
                  className={`fill-slate-500 text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${isHovered ? 'fill-white' : ''}`}
                >
                  {node.label}
                </text>
                {isHovered && (
                  <text 
                    x={node.x} y={node.y - 30} 
                    textAnchor="middle" 
                    className="fill-slate-600 text-[7px] font-mono uppercase tracking-tighter"
                  >
                    {node.id}
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </svg>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_70%)] pointer-events-none"></div>
    </div>
  );
};

export default MeshVisualizer;
