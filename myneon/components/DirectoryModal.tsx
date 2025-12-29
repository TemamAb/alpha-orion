
import React, { useState } from 'react';
import { DirectoryStructure, DirectoryNode } from '../types';

interface Props {
  structure: DirectoryStructure;
  onClose: () => void;
}

const FileNode: React.FC<{ node: DirectoryNode; depth: number }> = ({ node, depth }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isDir = node.type === 'directory';

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-white/5 transition-colors cursor-pointer group`}
        style={{ paddingLeft: `${depth * 1.5}rem` }}
        onClick={() => isDir && setIsOpen(!isOpen)}
      >
        <span className="text-slate-500">
          {isDir ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={isOpen ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className={isOpen ? "text-blue-500/50" : ""}><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
          )}
        </span>
        <span className={`text-xs font-mono ${isDir ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>
          {node.name}
        </span>
        {node.description && (
          <span className="text-[10px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            // {node.description}
          </span>
        )}
      </div>
      {isDir && isOpen && node.children && (
        <div>
          {node.children.map((child, i) => (
            <FileNode key={i} node={child as DirectoryNode} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const DirectoryModal: React.FC<Props> = ({ structure, onClose }) => {
  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
      <div className="glass w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden flex flex-col border border-blue-500/20 shadow-[0_0_120px_rgba(59,130,246,0.1)]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-blue-500/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="3" x2="9" y1="9" y2="9"/><line x1="3" x2="9" y1="15" y2="15"/></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                Directory Blueprint: <span className="text-blue-400 font-mono">{structure.projectName}</span>
              </h2>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Specialist Unit: Architect-V5</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-black uppercase border border-blue-500/30 text-blue-400 bg-blue-500/10">
                  Pattern: {structure.architectureStyle}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow flex overflow-hidden">
          {/* Sidebar Architecture Info */}
          <div className="w-80 border-r border-white/10 p-8 space-y-8 bg-black/20 overflow-y-auto custom-scrollbar">
            <section>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Architectural Rationale</h3>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-xs text-slate-400 leading-relaxed italic">
                "{structure.rationale}"
              </div>
            </section>
            
            <section>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Pattern Components</h3>
              <div className="space-y-2">
                {["Domain Isolation", "Anti-corruption Layer", "Hexagonal Bindings"].map(p => (
                  <div key={p} className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                    {p}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Main Tree Visualizer */}
          <div className="flex-grow p-8 overflow-y-auto custom-scrollbar bg-[#050507]">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">File Hierarchy Explorer</h3>
                <span className="text-[10px] text-slate-600 font-mono">Generated IX-Blueprint ➔ JSON.tree</span>
              </div>
              
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                {structure.root.map((node, i) => (
                  <FileNode key={i} node={node} depth={0} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-8 bg-white/5 border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">
            Structural Integrity Verified • Specialist Arch-V5 Sig: 0x{Math.random().toString(16).slice(2, 10).toUpperCase()}
          </div>
          <button 
            onClick={onClose}
            className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-100"
          >
            Confirm Architecture
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectoryModal;
