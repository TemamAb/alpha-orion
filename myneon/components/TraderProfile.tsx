import React, { useState, useRef } from 'react';
import { ClientProfile } from '../types';
import Tooltip from './Tooltip';

interface Props {
  profile: ClientProfile;
  onUpdate: (updates: Partial<ClientProfile>) => void;
}

const TraderProfile: React.FC<Props> = ({ profile, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => onUpdate({ avatarUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="glass p-12 rounded-[4rem] border-white/5 space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center gap-10 border-b border-white/5 pb-12">
        {/* Sovereign Avatar Portal */}
        <div className="relative group">
          <div className="w-40 h-40 rounded-full border-4 border-white/5 overflow-hidden bg-black/40 flex items-center justify-center relative shadow-2xl">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="Trader Identity" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            )}
            <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Update Identity</span>
            </div>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 p-3 bg-blue-600 text-white rounded-2xl shadow-xl hover:scale-110 transition-all border border-blue-400/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
        </div>

        <div className="text-center md:text-left flex-1">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">{profile.name}</h2>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.4em]">Authorized Trader Account // AE-IX-AUTH</p>
          
          <div className="flex flex-wrap gap-4 mt-8">
             <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest block">Account Grade</span>
                <span className="text-xs font-mono font-bold text-blue-400 uppercase">Sovereign Elite</span>
             </div>
             <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest block">Neural Handshake</span>
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">Synchronized</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Risk Profile Logic */}
        <section className="space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">Risk Appetite Hub</h3>
            <span className="text-[10px] font-mono text-blue-500 uppercase">Mode: {profile.riskTolerance > 80 ? 'Apex' : profile.riskTolerance > 40 ? 'Voyager' : 'Guardian'}</span>
          </div>
          
          <div className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-600 uppercase">Aggression Baseline</span>
                <span className="text-2xl font-mono font-black text-white">{profile.riskTolerance}%</span>
              </div>
              <input 
                type="range" min="1" max="100" 
                value={profile.riskTolerance}
                onChange={(e) => onUpdate({ riskTolerance: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer" 
              />
            </div>
            
            <p className="text-[11px] text-slate-500 leading-relaxed italic">
              "Higher risk increases slippage tolerance and multi-hop complexity, targeting larger arbitrage spreads with heightened atomic volatility."
            </p>
          </div>
        </section>

        {/* Reinvestment ROI Optimization */}
        <section className="space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">Compound Capital Engine</h3>
            <span className="text-[10px] font-mono text-emerald-500 uppercase">Auto-Scale: Active</span>
          </div>
          
          <div className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-600 uppercase">Profit Reinvestment</span>
                <span className="text-2xl font-mono font-black text-white">{profile.reinvestmentRate}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={profile.reinvestmentRate}
                onChange={(e) => onUpdate({ reinvestmentRate: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-emerald-500 cursor-pointer" 
              />
            </div>
            
            <p className="text-[11px] text-slate-500 leading-relaxed italic">
              "Reinvestment logic determines the percentage of atomic profits returned to the execution liquidity pool for 2nd-order compounding."
            </p>
          </div>
        </section>
      </div>

      {/* Module 4-Pack HUD (Articulated Feature Visualization) */}
      <section className="pt-12 border-t border-white/5">
         <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.6em] mb-10 text-center">Module Integrity Protocol // 4-Pack System</h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Logic', icon: '⚙️', desc: 'Compound ROI Calculation', color: 'text-blue-400' },
              { label: 'Security', icon: '🛡️', desc: 'Sovereign Identity Siloing', color: 'text-red-400' },
              { label: 'Optimization', icon: '⚡', desc: 'Edge-Cached State Sync', color: 'text-cyan-400' },
              { label: 'Telemetry', icon: '📊', desc: 'Emotional Jitter Monitor', color: 'text-emerald-400' }
            ].map(quad => (
              <div key={quad.label} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] text-center space-y-2 group hover:border-white/20 transition-all">
                <span className="text-2xl">{quad.icon}</span>
                <div className={`text-[10px] font-black uppercase tracking-widest ${quad.color}`}>{quad.label}</div>
                <div className="text-[8px] text-slate-600 uppercase font-bold">{quad.desc}</div>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
};

export default TraderProfile;
