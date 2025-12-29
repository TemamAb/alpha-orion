import React from 'react';
import Logo from './Logo';
import { BrandingConfig } from '../types';

interface Props {
  onEnter: () => void;
  branding: BrandingConfig;
}

const ProductCover: React.FC<Props> = ({ onEnter, branding }) => {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#020204]">
      {/* Deep Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/[0.03] blur-[180px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-amber-600/[0.02] blur-[180px] rounded-full"></div>
      </div>

      <div className="relative group animate-in fade-in zoom-in duration-1500">
        <div className="flex flex-col items-center gap-20">
          
          {/* Identity Core: AION VIX (Precise Sizing) */}
          <div className="flex items-center gap-6">
            <div className="flex items-center justify-center">
              <Logo 
                size={55} 
                color="#00A3FF" 
                className="opacity-80 group-hover:opacity-100 transition-all duration-1000 drop-shadow-[0_0_30px_rgba(0,163,255,0.4)]" 
              />
            </div>
            <div className="flex flex-col pt-2">
              <h1 className="flex items-baseline select-none">
                <span className="text-7xl font-black tracking-tighter bg-gradient-to-b from-white via-slate-300 to-slate-500 bg-clip-text text-transparent">
                  AION
                </span>
                <div className="flex items-baseline ml-1">
                  <span className="text-[18px] font-black text-blue-500 uppercase tracking-tight">V</span>
                  <span className="text-[18px] font-black text-[#D4AF37] uppercase tracking-tight ml-0.5 drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">IX</span>
                </div>
              </h1>
              <div className="h-0.5 w-full bg-gradient-to-r from-blue-500/30 via-slate-500/20 to-transparent mt-2"></div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-10">
            <button 
              onClick={onEnter}
              className="px-20 py-6 bg-transparent border border-white/5 hover:border-blue-500/30 text-slate-500 hover:text-white rounded-full font-black uppercase tracking-[0.5em] text-[10px] transition-all duration-700 group/btn shadow-2xl hover:shadow-blue-500/10"
            >
              Initialize Sovereign Forge
            </button>

            <div className="text-[8px] text-slate-800 font-mono uppercase tracking-[0.6em]">
              Authorized Strategic Infrastructure • AION VIX v9.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCover;