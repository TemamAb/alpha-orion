
import React from 'react';
import { GapsReport } from '../types';
import Tooltip from './Tooltip';

interface Props {
  report: GapsReport;
  onClose: () => void;
}

const GapsAnalyzerModal: React.FC<Props> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[120px]">
      <div className="glass w-full max-w-6xl h-[85vh] rounded-[4rem] overflow-hidden flex flex-col border border-purple-500/40 shadow-[0_0_200px_rgba(168,85,247,0.2)] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse"></div>
        
        {/* Header */}
        <div className="p-10 border-b border-white/10 flex justify-between items-center bg-purple-900/10">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-purple-600 rounded-[1.5rem] flex items-center justify-center shadow-[0_0_60px_rgba(168,85,247,0.4)] relative overflow-hidden group">
               <div className="absolute inset-0 bg-white/10 animate-pulse opacity-20"></div>
               <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Elite Gaps Analyzer IX</h2>
              <div className="flex items-center gap-6 mt-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Sig: {report.analyzerSignature}</span>
                <div className="px-4 py-1 bg-purple-500/10 rounded-full border border-purple-500/30 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></div>
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Protocol: Benchmark Discrepancy Map</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all group">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-90 transition-transform"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-12 custom-scrollbar bg-[#010103] space-y-12">
          
          {/* Global Gap Metric */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <section className="lg:col-span-4 p-10 bg-purple-500/5 border border-purple-500/20 rounded-[3rem] text-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-purple-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <h3 className="text-xs font-black text-purple-400 uppercase tracking-[0.4em] mb-8">Convergence Index</h3>
               <div className="relative w-40 h-40 mx-auto mb-8 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                     <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(168,85,247,0.1)" strokeWidth="12" />
                     <circle 
                       cx="80" cy="80" r="72" fill="none" stroke="currentColor" strokeWidth="12" 
                       strokeDasharray={`${2 * Math.PI * 72}`}
                       strokeDashoffset={`${2 * Math.PI * 72 * (1 - report.globalGapScore / 100)}`}
                       className="text-purple-500 transition-all duration-1500"
                       strokeLinecap="round"
                     />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-5xl font-mono font-black text-white">{report.globalGapScore}%</span>
                    <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest mt-1">ALIGNMENT</span>
                  </div>
               </div>
               <p className="text-[11px] text-slate-500 italic leading-relaxed">
                  "{report.benchmarkingRationale}"
               </p>
            </section>

            <section className="lg:col-span-8 p-10 bg-white/[0.02] border border-white/5 rounded-[3rem]">
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  Elite Precision Directives
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {report.precisionDirectives.map((dir, i) => (
                    <div key={i} className="flex gap-6 p-5 bg-black/40 border border-white/5 rounded-2xl hover:border-purple-500/30 transition-all group">
                       <span className="text-purple-500 font-mono font-black text-xl">0{i+1}</span>
                       <p className="text-[12px] text-slate-400 font-bold leading-relaxed group-hover:text-slate-200">{dir}</p>
                    </div>
                  ))}
               </div>
            </section>
          </div>

          {/* Detailed Module Discrepancy List */}
          <section className="space-y-8">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-4">
                <span className="w-10 h-px bg-purple-500/30"></span>
                Benchmark Comparison Matrix
             </h3>
             <div className="grid grid-cols-1 gap-6">
                {report.moduleGaps.map((gap, i) => (
                  <div key={i} className={`p-8 rounded-[2.5rem] border transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 ${
                    gap.impact === 'Critical' ? 'bg-red-500/5 border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.05)]' : 'bg-white/[0.02] border-white/5'
                  }`}>
                    <div className="flex-grow space-y-6">
                       <div className="flex items-center gap-4">
                          <span className={`px-3 py-0.5 rounded text-[8px] font-black uppercase ${
                            gap.impact === 'Critical' ? 'bg-red-500 text-white' : 
                            gap.impact === 'High' ? 'bg-purple-600 text-white' : 
                            'bg-slate-700 text-slate-300'
                          }`}>{gap.impact} GAP</span>
                          <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{gap.moduleName}</h4>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Discrepancy Details</span>
                             <ul className="space-y-2">
                                {gap.discrepancies.map((disc, di) => (
                                   <li key={di} className="flex gap-3 items-start text-xs text-slate-400 italic">
                                      <span className="text-red-500 mt-1.5">•</span>
                                      {disc}
                                   </li>
                                ))}
                             </ul>
                          </div>
                          <div className="space-y-3">
                             <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest block">Remediation Path</span>
                             <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
                                <p className="text-[11px] text-slate-300 font-medium leading-relaxed italic">"{gap.remediationPath}"</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-10 shrink-0 w-full lg:w-auto p-6 bg-black/40 border border-white/5 rounded-3xl">
                       <div className="text-center px-4">
                          <div className="text-[9px] font-black text-slate-700 uppercase mb-2">Current</div>
                          <div className="text-2xl font-mono font-black text-slate-500">{gap.currentGrade}%</div>
                       </div>
                       <div className="w-px h-10 bg-white/5"></div>
                       <div className="text-center px-4">
                          <div className="text-[9px] font-black text-purple-500 uppercase mb-2">Target</div>
                          <div className="text-4xl font-mono font-black text-white">{gap.targetGrade}%</div>
                          <div className="text-[7px] text-slate-800 font-black uppercase mt-1">ELITE GRADE</div>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-10 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Aineonlite Gaps-IX • Engine Alignment: ANALYZED • Sync: {new Date(report.timestamp).toLocaleTimeString()}
          </div>
          <button 
            onClick={onClose}
            className="px-16 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-purple-500/20 active:scale-95"
          >
            Authorize Precision Tuning
          </button>
        </div>
      </div>
    </div>
  );
};

export default GapsAnalyzerModal;
