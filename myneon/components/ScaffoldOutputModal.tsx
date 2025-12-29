
import React, { useState } from 'react';
import { ScaffoldResult } from '../types';

interface Props {
  moduleName: string;
  result: ScaffoldResult;
  onClose: () => void;
}

const ScaffoldOutputModal: React.FC<Props> = ({ moduleName, result, onClose }) => {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const activeFile = result.filesGenerated[activeFileIndex];

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[100px]">
      <div className="glass w-full max-w-6xl h-[85vh] rounded-[3.5rem] overflow-hidden flex flex-col border border-blue-500/40 shadow-[0_0_150px_rgba(59,130,246,0.2)]">
        {/* Header */}
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-blue-500/5 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-pulse"></div>
          <div className="flex items-center gap-8">
            <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M16 18 22 12 16 6"/><path d="M8 6 2 12 8 18"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Scaffold Source: {moduleName}</h2>
              <div className="flex items-center gap-6 mt-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Protocol: Elite Code Generation</span>
                <div className="px-4 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Test Coverage: {result.testResults.coverage}%</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow flex overflow-hidden bg-[#020204]">
          {/* File Sidebar */}
          <div className="w-72 border-r border-white/5 p-6 bg-black/40 space-y-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6">Generated Modules</h3>
            <div className="space-y-2">
              {result.filesGenerated.map((file, i) => (
                <button
                  key={i}
                  onClick={() => setActiveFileIndex(i)}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3 group ${
                    activeFileIndex === i ? 'bg-blue-600/10 border-blue-500/50 text-white' : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">{file.name}</span>
                </button>
              ))}
            </div>

            <div className="pt-8 border-t border-white/5 mt-auto">
               <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Simulation Logs</h3>
               <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                 {result.testResults.logs.map((log, i) => (
                   <div key={i} className="text-[9px] font-mono text-slate-500 flex gap-2">
                     <span className="text-blue-500">>></span> {log}
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Code Editor Content */}
          <div className="flex-grow flex flex-col">
            <div className="flex-grow p-8 bg-[#050507] overflow-y-auto custom-scrollbar font-mono text-sm group relative">
               <div className="absolute inset-0 bg-blue-500/[0.01] pointer-events-none"></div>
               <div className="absolute top-4 right-8 flex items-center gap-4">
                  <span className="text-[9px] text-slate-700 uppercase font-black tracking-widest">Read-Only View</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(activeFile.content);
                      alert("Code copied to buffer.");
                    }}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-blue-400 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </button>
               </div>
               <pre className="text-blue-400/80 leading-relaxed whitespace-pre-wrap select-all">
                  {activeFile.content}
               </pre>
            </div>
            <div className="p-6 bg-black border-t border-white/5 flex justify-between items-center">
              <div className="text-[10px] text-slate-700 font-mono">
                {activeFile.name} • {activeFile.content.length} chars • UTF-8
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Linter Optimized</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">
            Elite Scaffold Repository • Handshake Verified • V.1.0-IX
          </div>
          <button 
            onClick={onClose}
            className="px-16 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_15px_40px_rgba(59,130,246,0.3)] hover:scale-[1.05] active:scale-95"
          >
            Acknowledge Scaffolding
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScaffoldOutputModal;
