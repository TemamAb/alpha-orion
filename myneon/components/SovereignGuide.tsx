
import React from 'react';

interface Props {
  onClose: () => void;
}

const SovereignGuide: React.FC<Props> = ({ onClose }) => {
  const protocols = [
    { 
      title: "Blockchain Data Mandate", 
      desc: "All data utilized in simulation or production contexts must be derived exclusively from the blockchain. Synthetic or mock data entry is strictly prohibited." 
    },
    { 
      title: "Elite Benchmark Validation", 
      desc: "Aineon's Top 0.001% performance claims must be validated by live blockchain state or verified third-party reliable external industry data." 
    },
    { 
      title: "Etherscan Profit Verification", 
      desc: "Every profit metric displayed in Production Mode must undergo Etherscan validation before being reported or visualized on dashboard analytics." 
    }
  ];

  const tips = [
    { title: "The Sovereign Handshake", desc: "Always select the 'Orchestrator' agent first. He coordinates the Tri-Tier mesh and prevents module collision." },
    { title: "MEV Shield Protocol", desc: "Before any production deployment, execute a 'Security Sentinel' scan. This enables private Flashbots routing to bypass mempool extraction." },
    { title: "Platinum Certification", desc: "To reach 100% compliance, you must 'Deep Dive' with the Protocol Specialist, then 'Audit' with the Specialist QA unit." },
    { title: "Sovereign Containerization", desc: "Use the Dockerization module to synthesize Alpine-hardened clusters. Host-mode networking is recommended for sub-ms transport." },
    { title: "Neural Optimization", desc: "Use the Neural Optimizer only when simulation data is block-anchored to ensure 0% mock data usage." }
  ];

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl">
      <div className="glass w-full max-w-5xl max-h-[90vh] rounded-[3.5rem] overflow-hidden flex flex-col border border-blue-500/30 shadow-[0_0_100px_rgba(59,130,246,0.2)]">
        <div className="p-10 border-b border-white/10 flex justify-between items-center bg-blue-600/5">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-blue-600 rounded-2xl shadow-lg">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Sovereign Manual</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Elite Operator Guidance & Core Protocols</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-12 overflow-y-auto custom-scrollbar bg-[#020204] space-y-16">
          {/* Core Protocols Section */}
          <section>
            <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.5em] mb-10 flex items-center gap-4">
              <span className="w-8 h-[2px] bg-blue-500"></span>
              Aineon Core Protocols
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {protocols.map((proto, i) => (
                <div key={i} className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-[2.5rem] relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                  </div>
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Mandate 0{i+1}</div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4">{proto.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">"{proto.desc}"</p>
                </div>
              ))}
            </div>
          </section>

          {/* Operational Tips */}
          <section>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] mb-10 flex items-center gap-4">
               <span className="w-8 h-[2px] bg-slate-700"></span>
               Operational Strategies
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {tips.map((tip, i) => (
                <div key={i} className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-blue-500/20 transition-all group">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-xl font-mono font-black text-blue-900 group-hover:text-blue-500 transition-colors">T{i+1}</span>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">{tip.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">"{tip.desc}"</p>
                </div>
              ))}
            </div>
          </section>

          <div className="p-10 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/10 rounded-[3rem] text-center">
             <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-4">Elite Compliance Acknowledgment</h3>
             <p className="text-[11px] text-slate-400 text-center leading-relaxed max-w-2xl mx-auto italic">
               "Aineonlite IX mandates absolute technical integrity. By operating this forge, you acknowledge that every arbitrage cycle must align with Blockchain-Native state data and Etherscan-verified financial reporting."
             </p>
          </div>
        </div>

        <div className="p-10 bg-white/[0.02] border-t border-white/10 flex justify-center">
          <button 
            onClick={onClose}
            className="px-20 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-xl shadow-blue-500/20 active:scale-95"
          >
            I Command the Forge
          </button>
        </div>
      </div>
    </div>
  );
};

export default SovereignGuide;
