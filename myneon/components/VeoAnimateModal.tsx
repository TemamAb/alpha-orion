import React, { useState, useRef, useEffect } from 'react';
import { generateArchitectureVideo } from '../services/videoService';

interface Props {
  onClose: () => void;
}

const VeoAnimateModal: React.FC<Props> = ({ onClose }) => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      const selected = await (window as any).aistudio.hasSelectedApiKey();
      setHasKey(selected);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    await (window as any).aistudio.openSelectKey();
    setHasKey(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMimeType(file.type);
      const reader = new FileReader();
      reader.onload = () => setSourceImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnimate = async () => {
    if (!sourceImage || !prompt) return;
    setIsGenerating(true);
    try {
      const base64Data = sourceImage.split(',')[1];
      const url = await generateArchitectureVideo(prompt, base64Data, mimeType, aspectRatio);
      setVideoUrl(url);
    } catch (error: any) {
      if (error.message === "API_KEY_NOT_FOUND") {
        setHasKey(false);
        alert("Please select your API key again.");
      } else {
        alert("Veo synthesis failed. Neural link timeout.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!hasKey) {
    return (
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/98 backdrop-blur-md">
        <div className="glass p-12 rounded-[3rem] text-center max-w-lg border-blue-500/30">
          <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 8h10"/><path d="M7 12h10"/><path d="M7 16h10"/></svg>
          </div>
          <h2 className="text-2xl font-black text-white uppercase mb-4">API Key Required</h2>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">Veo video generation requires a valid API key from a paid GCP project. Please select your key to continue.</p>
          <button 
            onClick={handleSelectKey}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20"
          >
            Select API Key
          </button>
          <p className="mt-6 text-[10px] text-slate-600 uppercase">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline hover:text-blue-500">Billing Documentation</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[100px]">
      <div className="glass w-full max-w-7xl h-[90vh] rounded-[4rem] overflow-hidden flex flex-col border border-purple-500/40 shadow-[0_0_200px_rgba(168,85,247,0.15)]">
        <div className="p-10 border-b border-white/10 flex justify-between items-center bg-purple-500/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse"></div>
          <div className="flex items-center gap-8">
            <div className="p-5 bg-purple-600 rounded-[2rem] shadow-2xl shadow-purple-500/40">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Veo Architecture Animator</h2>
              <div className="flex items-center gap-6 mt-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Model: Veo 3.1 Fast</span>
                <div className="px-4 py-1 bg-purple-500/10 rounded-full border border-purple-500/30 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></div>
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Kinetic Synthesis Active</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow flex overflow-hidden bg-[#020205]">
          <div className="w-96 border-r border-white/5 p-10 space-y-10 bg-black/40 overflow-y-auto custom-scrollbar">
            <section>
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mb-6">Source Frame</h3>
              {!sourceImage ? (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-600 group-hover:text-purple-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Select Keyframe</span>
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
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mb-4">Aspect Ratio</h3>
              <div className="flex gap-4">
                <button onClick={() => setAspectRatio('16:9')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${aspectRatio === '16:9' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}>16:9</button>
                <button onClick={() => setAspectRatio('9:16')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${aspectRatio === '9:16' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}>9:16</button>
              </div>
            </section>

            <section>
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mb-6">Motion Prompt</h3>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the cinematic camera movement or asset animation..."
                className="w-full h-32 bg-black border border-white/10 rounded-3xl p-6 text-sm text-slate-300 outline-none focus:border-purple-500/50 transition-all resize-none placeholder:text-slate-700 font-medium"
              />
            </section>

            <button 
              onClick={handleAnimate}
              disabled={!sourceImage || !prompt || isGenerating}
              className="w-full py-5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-purple-500/20 active:scale-95 flex items-center justify-center gap-4"
            >
              {isGenerating ? 'Synthesizing kinetic flow...' : 'Generate Architecture Video'}
            </button>
          </div>

          <div className="flex-grow p-12 overflow-y-auto custom-scrollbar bg-[#050507] flex flex-col items-center justify-center">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-8">
                <div className="w-32 h-32 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-black text-white uppercase tracking-tighter">Animating Asset Mesh</p>
                  <p className="text-xs text-slate-500 font-mono animate-pulse">This may take a few minutes. Processing on Veo Fast cluster...</p>
                </div>
              </div>
            ) : videoUrl ? (
              <div className="w-full h-full flex flex-col gap-12 animate-in fade-in zoom-in duration-500">
                <video src={videoUrl} controls autoPlay loop className="flex-grow rounded-[3rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] bg-black" />
                <div className="flex justify-center gap-6">
                  <a href={videoUrl} download="astra-elite-motion.mp4" className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    Save Cinematics
                  </a>
                  <button onClick={() => setVideoUrl(null)} className="px-10 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Generate New Segment</button>
                </div>
              </div>
            ) : (
              <div className="text-center opacity-20 max-w-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="mx-auto mb-8"><path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2"/><path d="m22 8-6 4 6 4V8Z"/><circle cx="10" cy="12" r="3"/></svg>
                <p className="text-xl font-black uppercase tracking-widest text-white">Video Forge Idle</p>
                <p className="text-xs font-medium uppercase tracking-tighter mt-4 leading-relaxed">Provide a starting frame and motion parameters to synthesize ultra-high-fidelity architecture animations.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VeoAnimateModal;