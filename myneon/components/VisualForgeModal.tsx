
import React, { useState, useRef } from 'react';
import { editArchitectureVisual, ImageEditResult } from '../services/imageService';

interface Props {
  onClose: () => void;
}

const VisualForgeModal: React.FC<Props> = ({ onClose }) => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [isForging, setIsForging] = useState(false);
  const [result, setResult] = useState<ImageEditResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMimeType(file.type);
      const reader = new FileReader();
      reader.onload = () => setSourceImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleForge = async () => {
    if (!sourceImage || !prompt) return;
    setIsForging(true);
    try {
      const base64Data = sourceImage.split(',')[1];
      const forgeResult = await editArchitectureVisual(base64Data, mimeType, prompt);
      setResult(forgeResult);
    } catch (error) {
      alert("Visual Forge failed to synthesize target. Check neural link.");
    } finally {
      setIsForging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[100px]">
      <div className="glass w-full max-w-7xl h-[90vh] rounded-[4rem] overflow-hidden flex flex-col border border-blue-500/40 shadow-[0_0_200px_rgba(59,130,246,0.15)]">
        
        {/* Header */}
        <div className="p-10 border-b border-white/10 flex justify-between items-center bg-blue-500/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse"></div>
          <div className="flex items-center gap-8">
            <div className="p-5 bg-blue-600 rounded-[2rem] shadow-2xl shadow-blue-500/40">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">AI Visual Forge</h2>
              <div className="flex items-center gap-6 mt-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Model: Gemini 2.5 Flash Image</span>
                <div className="px-4 py-1 bg-blue-500/10 rounded-full border border-blue-500/30 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Architectural Synthesis Active</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow flex overflow-hidden bg-[#020205]">
          {/* Controls Sidebar */}
          <div className="w-96 border-r border-white/5 p-10 space-y-10 bg-black/40 overflow-y-auto custom-scrollbar">
            <section>
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mb-6">Source Selection</h3>
              {!sourceImage ? (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-600 group-hover:text-blue-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Upload Architecture</span>
                </button>
              ) : (
                <div className="relative group">
                  <img src={sourceImage} className="w-full aspect-video object-cover rounded-3xl border border-white/10" alt="Source" />
                  <button 
                    onClick={() => setSourceImage(null)}
                    className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </section>

            <section>
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mb-6">Forge Directive</h3>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. 'Add a high-redundancy bridge between scanner and executor clusters' or 'Apply retro-futuristic grid filter'"
                className="w-full h-40 bg-black border border-white/10 rounded-3xl p-6 text-sm text-slate-300 outline-none focus:border-blue-500/50 transition-all resize-none placeholder:text-slate-700 font-medium"
              />
            </section>

            <button 
              onClick={handleForge}
              disabled={!sourceImage || !prompt || isForging}
              className="w-full py-5 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-4 group"
            >
              {isForging ? 'Synthesizing...' : 'Initialize Forge'}
              {!isForging && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform"><path d="m13 2 1.993 1.993a.25.25 0 0 1 0 .354L13 6.34"/><path d="m13 18 1.993 1.993a.25.25 0 0 0 0 .354L13 22.34"/><path d="M4.831 4.114a1.65 1.65 0 0 0 0 2.334l1.453 1.453"/><path d="M4.831 17.553a1.65 1.65 0 0 1 0-2.334l1.453-1.453"/><path d="M15 12h-9"/></svg>}
            </button>
          </div>

          {/* Main Display Area */}
          <div className="flex-grow p-12 overflow-y-auto custom-scrollbar bg-[#050507] flex flex-col items-center justify-center">
            {!result && !isForging && (
              <div className="text-center opacity-20 max-w-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="mx-auto mb-8"><path d="M12 3v18"/><path d="M3 12h18"/><path d="M12 3l-4 4"/><path d="M12 3l4 4"/><path d="M12 21l-4-4"/><path d="M12 21l4-4"/><path d="M3 12l4-4"/><path d="M3 12l4 4"/><path d="M21 12l-4-4"/><path d="M21 12l4 4"/></svg>
                <p className="text-xl font-black uppercase tracking-widest text-white">Visual Mesh Idle</p>
                <p className="text-xs font-medium uppercase tracking-tighter mt-4 leading-relaxed">Upload a diagram and provide a structural directive to begin AI-powered architectural refinement.</p>
              </div>
            )}

            {isForging && (
              <div className="flex flex-col items-center gap-8">
                <div className="w-32 h-32 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-black text-white uppercase tracking-tighter">Forging Visual Assets</p>
                  <p className="text-xs text-slate-500 font-mono animate-pulse">Relaying frames through Gemini IX...</p>
                </div>
              </div>
            )}

            {result && !isForging && (
              <div className="w-full h-full flex flex-col gap-12 animate-in fade-in zoom-in duration-500">
                <div className="flex-grow relative rounded-[3rem] overflow-hidden border border-white/10 group shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                  <img src={result.imageUrl} className="w-full h-full object-contain bg-black" alt="Forged Output" />
                  <div className="absolute bottom-8 left-8 right-8 p-6 glass rounded-3xl border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">Synthesis Rationale</h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium italic">"{result.explanation}"</p>
                  </div>
                </div>
                
                <div className="flex justify-center gap-6">
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = result.imageUrl;
                      link.download = 'astra-elite-arch-refined.png';
                      link.click();
                    }}
                    className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 flex items-center gap-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    Download Refined Asset
                  </button>
                  <button 
                    onClick={() => setResult(null)}
                    className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20"
                  >
                    Start New Refinement
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            AstraElite Visual-IX Hub • Handshake: SECURE • Block: {Math.floor(Math.random() * 20000000)}
          </div>
          <button 
            onClick={onClose}
            className="px-12 py-4 border border-white/10 hover:bg-white/5 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Exit Forge
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisualForgeModal;
