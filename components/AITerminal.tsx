import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Sparkles, TrendingUp, AlertCircle, Cpu, Zap, Shield, Microscope, Target } from 'lucide-react';
import { chatWithAI } from '../services/geminiService';

interface AITerminalProps {
  realTimeData: any;
}

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
}

const AITerminal: React.FC<AITerminalProps> = ({ realTimeData }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Alpha-Orion AI Terminal initialized. Enterprise-grade arbitrage analysis active.',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'ai',
      content: 'I am your AI assistant for analyzing and enhancing the arbitrage flash loan engine. I can help with:\n\n• Strategy optimization analysis\n• Gas efficiency recommendations\n• MEV protection insights\n• Profit maximization strategies\n• Real-time market analysis\n• Code quality improvements\n\nHow can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const aiResponse = await chatWithAI(input, realTimeData);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI Terminal Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeSystem = async (topic: string) => {
    setInput(`Perform a deep enterprise analysis on: ${topic}`);
    handleSend();
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/50">
      {/* Header */}
      <div className="glass-panel border-b border-slate-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Terminal className="text-indigo-400" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Alpha-Orion Intelligence Terminal</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Enterprise-Grade v4.2.0 (Gemini 1.5 Pro Enabled)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => analyzeSystem('MEV Protection')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-lg transition-all"
              >
                <Shield size={12} className="text-indigo-400" />
                <span className="text-[9px] font-bold text-slate-400 uppercase">MEV Analysis</span>
              </button>
              <button
                onClick={() => analyzeSystem('Gas Efficiency')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-lg transition-all"
              >
                <Zap size={12} className="text-emerald-400" />
                <span className="text-[9px] font-bold text-slate-400 uppercase">Gas Audit</span>
              </button>
              <button
                onClick={() => analyzeSystem('Strategy ROI')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-lg transition-all"
              >
                <TrendingUp size={12} className="text-amber-400" />
                <span className="text-[9px] font-bold text-slate-400 uppercase">ROI Forge</span>
              </button>
              <button
                onClick={() => analyzeSystem('Champion Discovery & Wallet Forging')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-lg transition-all"
              >
                <Target size={12} className="text-purple-400" />
                <span className="text-[9px] font-bold text-slate-400 uppercase">Champion Discovery</span>
              </button>
              <button
                onClick={() => analyzeSystem('Wallet Forging & Strategy Synthesis')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-lg transition-all"
              >
                <Cpu size={12} className="text-cyan-400" />
                <span className="text-[9px] font-bold text-slate-400 uppercase">Wallet Forge</span>
              </button>
            </div>
            <div className="h-8 w-px bg-slate-800 mx-1" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Core Uplink Stable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl p-4 ${message.type === 'user'
                ? 'bg-indigo-500/20 border border-indigo-500/30'
                : message.type === 'ai'
                  ? 'bg-slate-800/50 border border-slate-700'
                  : 'bg-amber-500/10 border border-amber-500/20'
                }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {message.type === 'ai' && <Sparkles size={14} className="text-indigo-400" />}
                {message.type === 'system' && <AlertCircle size={14} className="text-amber-400" />}
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  {message.type === 'user' ? 'You' : message.type === 'ai' ? 'AI Assistant' : 'System'}
                </span>
                <span className="text-[8px] text-slate-600">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                <span className="text-xs text-slate-400">AI is analyzing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glass-panel border-t border-slate-800 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI about strategies, optimization, profits..."
            className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Send size={16} />
            <span className="text-xs font-bold">Send</span>
          </button>
        </div>
        <p className="text-[9px] text-slate-600 mt-2 uppercase tracking-wider">
          Powered by Gemini AI • Enterprise-Grade Analysis
        </p>
      </div>
    </div>
  );
};

export default AITerminal;
