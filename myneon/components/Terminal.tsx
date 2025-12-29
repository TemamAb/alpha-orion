
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SpecialistAgent } from '../types';
import Tooltip from './Tooltip';

interface Props {
  messages: ChatMessage[];
  selectedAgent: SpecialistAgent;
  onSendMessage: (msg: string) => void;
  onSelectAgent: (agentId: string) => void;
  agents: SpecialistAgent[];
}

const Terminal: React.FC<Props> = ({ messages, selectedAgent, onSendMessage, onSelectAgent, agents }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex h-full bg-[#0d1117] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Main Terminal Body */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-6 py-4 bg-[#161b22] border-b border-white/5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 border-b-2 border-blue-500 pb-2 pt-1 px-1">
              <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Protocol Console</span>
            </div>
            <div className="flex items-center gap-2 pb-2 pt-1 px-1 opacity-40 hover:opacity-100 cursor-pointer transition-opacity">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mesh Debug</span>
            </div>
          </div>
          
          <Tooltip content="Swap specialist agents to access domain-specific arbitrage directives and cluster management." position="bottom">
            <div className="relative group">
              <button className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                  {selectedAgent.icon} {selectedAgent.name}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#0d1117] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] py-3 invisible group-hover:visible z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-2 mb-2 border-b border-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Specialist Registry</span>
                </div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {agents.map(agent => (
                    <button 
                      key={agent.id}
                      onClick={() => onSelectAgent(agent.id)}
                      className={`w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-white/5 transition-colors ${selectedAgent.id === agent.id ? 'bg-blue-500/10' : ''}`}
                    >
                      <span className="text-lg">{agent.icon}</span>
                      <div>
                        <div className={`text-[11px] font-black uppercase tracking-tight ${selectedAgent.id === agent.id ? 'text-blue-400' : 'text-slate-300'}`}>{agent.name}</div>
                        <div className="text-[9px] text-slate-600 uppercase font-bold">{agent.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Tooltip>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 font-mono text-xs space-y-4 custom-scrollbar bg-[#0d1117]">
          <div className="text-slate-700 text-[9px] font-bold uppercase tracking-widest mb-6 opacity-50">
            AstraElite (TM) Mesh Handshake Protocol v7.2-IX<br/>
            Secure encrypted link established via private RPC...
          </div>
          
          {messages.map((msg, i) => (
            <div key={i} className="flex gap-4 group">
              <div className="flex-shrink-0 w-16 text-right">
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${msg.role === 'user' ? 'text-blue-500' : 'text-emerald-500'}`}>
                  {msg.role === 'user' ? 'USER' : 'IX-SYS'}
                </span>
              </div>
              <div className={`flex-1 p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-500/5 border border-blue-500/10' : 'bg-white/[0.02] border border-white/5 shadow-inner'}`}>
                <div className="text-slate-300 whitespace-pre-wrap leading-relaxed selection:bg-blue-500/30">{msg.content}</div>
                <div className="mt-2 text-[8px] text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  TIMESTAMP: {msg.timestamp} // VERIFIED
                </div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-4 bg-[#161b22] border-t border-white/5 flex gap-4">
          <div className="flex-shrink-0 flex items-center text-blue-500 font-black ml-2 animate-pulse">
            $
          </div>
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Instruct ${selectedAgent.name.split(' ')[0]}...`}
            className="flex-1 bg-transparent border-none outline-none text-blue-400 font-mono text-xs placeholder:text-slate-700 focus:ring-0"
          />
          <Tooltip content="Submit direct command to the active specialist for neural processing." position="top">
            <button 
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all h-full shadow-lg shadow-blue-500/20 active:scale-95"
            >
              EXECUTE
            </button>
          </Tooltip>
        </form>
      </div>

      {/* Specialist Insight Sidebar */}
      <div className="w-80 bg-black/40 border-l border-white/5 p-6 flex flex-col gap-8 hidden xl:flex">
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Active Protocol</h3>
          </div>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
            "{selectedAgent.responsibility}"
          </p>
        </section>

        <div className="h-px bg-white/5"></div>

        <section className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-3 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-500"><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m9 14 2 2 4-4"/></svg>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Mission Backlog</h3>
          </div>
          <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
            {selectedAgent.missionBacklog.map((item, i) => (
              <div key={i} className="group/task">
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter ${
                    item.status === 'verified' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                    item.status === 'active' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 animate-pulse' :
                    'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                    {item.status}
                  </span>
                  <span className="text-[8px] font-mono text-slate-700 group-hover/task:text-slate-500 transition-colors">0{i+1}</span>
                </div>
                <div className={`text-[10px] font-bold leading-tight ${item.status === 'verified' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                  {item.task}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
           <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1">Neural Load</div>
           <div className="text-xs font-mono font-black text-blue-500">OPTIMAL (14.2%)</div>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
