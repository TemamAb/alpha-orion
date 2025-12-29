
import React, { useState } from 'react';
import { DockerReport } from '../types';

interface Props {
  report: DockerReport;
  onClose: () => void;
}

const DockerConsoleModal: React.FC<Props> = ({ report, onClose }) => {
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  return (
    <div className="fixed inset-0 z-[280] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[100px]">
      <div className="glass w-full max-w-6xl h-[90vh] rounded-[4rem] overflow-hidden flex flex-col border border-indigo-500/40 shadow-[0_0_200px_rgba(99,102,241,0.2)]">
        
        {/* Header */}
        <div className="p-10 border-b border-white/10 flex justify-between items-center bg-indigo-900/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse"></div>
          <div className="flex items-center gap-8">
            <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-900/40 relative group">
              <div className="absolute inset-0 bg-white/20 animate-ping rounded-[2rem] opacity-20"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M22 7.7L18 6L14 7.7V11.3L18 13L22 11.3V7.7Z"/><path d="M12 7.7L8 6L4 7.7V11.3L8 13L12 11.3V7.7Z"/><path d="M18 13L14 14.7V18.3L18 20L22 18.3V14.7L18 13Z"/><path d="M8 13L4 14.7V18.3L8 20L12 18.3V14.7L8 13Z"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Infrastructure Forge Hub</h2>
              <div className="flex items-center gap-6 mt-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Agent: Containerization Specialist IX</span>
                <div className="px-4 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/30 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Environment Siloed</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all group">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-90 transition-transform"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow flex overflow-hidden bg-[#020205]">
          {/* File Sidebar */}
          <div className="w-72 border-r border-white/5 p-6 bg-black/40 space-y-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6">Environment Configs</h3>
            <div className="space-y-2">
              {report.manifests.map((file, i) => (
                <button
                  key={i}
                  onClick={() => setActiveFileIndex(i)}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3 group ${
                    activeFileIndex === i ? 'bg-indigo-600/10 border-indigo-500/50 text-white' : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">{file.name}</span>
                </button>
              ))}
            </div>

            <div className="pt-8 border-t border-white/5 mt-auto">
               <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Resource Allocation</h3>
               <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-500 uppercase">CPU CORES</span>
                    <span className="text-indigo-400 font-bold">{report.resourceLimits.cpuCores}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-500 uppercase">MEM LIMIT</span>
                    <span className="text-indigo-400 font-bold">{report.resourceLimits.memoryLimitMb}MB</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-500 uppercase">NET MODE</span>
                    <span className="text-emerald-400 font-bold">{report.resourceLimits.networkMode}</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-grow flex flex-col">
            <div className="flex-grow p-8 bg-[#050507] overflow-y-auto custom-scrollbar font-mono text-sm relative">
               <div className="absolute inset-0 bg-indigo-500/[0.01] pointer-events-none"></div>
               <div className="absolute top-4 right-8 flex items-center gap-4">
                  <span className="text-[9px] text-slate-700 uppercase font-black tracking-widest">Sovereign Source</span>
                  <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${report.securityAnalysis.hardenedStatus ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400'}`}>
                    Layer Integrity: {report.securityAnalysis.layerScore}%
                  </div>
               </div>
               <pre className="text-indigo-400/80 leading-relaxed whitespace-pre-wrap select-all pt-10">
                  {report.manifests[activeFileIndex].content}
               </pre>
            </div>

            {/* Build Logs Footer */}
            <div className="h-48 border-t border-white/5 bg-black/80 p-6 overflow-y-auto custom-scrollbar">
               <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
                 Synthesis Log Stream
               </h4>
               <div className="space-y-1.5 font-mono text-[10px]">
                  {report.buildLogs.map((log, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-indigo-900 font-bold">[{i.toString().padStart(2, '0')}]</span>
                      <span className="text-indigo-300/60">{log}</span>
                    </div>
                  ))}
                  <div className="pt-1 flex items-center gap-2 text-indigo-500/20">
                    <span className="animate-pulse">_</span>
                    <span>READY FOR CLUSTER DEPLOYMENT</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Module: DOCKER-IX • Mode: STRICT-ISOLATION • Block: {Math.floor(Math.random() * 20000000)}
          </div>
          <button 
            onClick={onClose}
            className="px-16 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
          >
            Authorize Container Forge
          </button>
        </div>
      </div>
    </div>
  );
};

export default DockerConsoleModal;
