
import React from 'react';
import { TacticalReaction } from '../types';

interface Props {
  reactions: TacticalReaction[];
}

const TacticalReactionStream: React.FC<Props> = ({ reactions }) => {
  return (
    <div className="bg-black/60 rounded-[3rem] border border-white/5 overflow-hidden flex flex-col h-full">
      <div className="p-8 border-b border-white/5 flex justify-between items-center bg-blue-900/10">
        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
          Autonomous Reaction Stream
        </h3>
        <span className="text-[8px] font-mono text-slate-700">PROTO: AE-IX-REACTIVE</span>
      </div>
      
      <div className="flex-grow overflow-y-auto p-8 space-y-6 custom-scrollbar">
        {reactions.map((rx, i) => (
          <div key={rx.id} className="group border-l-2 border-blue-600/30 pl-6 space-y-2 animate-in slide-in-from-left duration-500">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{rx.targetMetric} Optimization</span>
              <span className="text-[8px] font-mono text-slate-800">{rx.timestamp}</span>
            </div>
            <p className="text-[11px] text-blue-300 font-bold leading-relaxed uppercase">
              <span className="text-white opacity-40 mr-2">Triggered:</span>
              {rx.actionTaken}
            </p>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Target Overtaken: {rx.competitorOvertaken}</span>
            </div>
          </div>
        ))}
        {reactions.length === 0 && (
          <div className="h-full flex items-center justify-center opacity-20 italic text-[10px] uppercase tracking-widest text-slate-500">
            Awaiting industry leader deviation...
          </div>
        )}
      </div>
    </div>
  );
};

export default TacticalReactionStream;
