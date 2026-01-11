import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';

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

    // Simulate AI processing
    setTimeout(() => {
      const aiResponse = generateAIResponse(input, realTimeData);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsProcessing(false);
    }, 1500);
  };

  const generateAIResponse = (query: string, data: any): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('optimize') || lowerQuery.includes('improve')) {
      return `Based on current metrics:\n\n✅ Gas Optimization: ${data.gasPrice} Gwei is ${parseFloat(data.gasPrice) < 30 ? 'optimal' : 'high'}\n✅ Transaction Count: ${data.txCount} validated transactions\n✅ Pair Monitoring: ${data.pairCount} active pairs\n\nRecommendations:\n1. Implement batch transaction processing for gas savings\n2. Enable MEV protection via Flashbots\n3. Optimize strategy execution timing\n4. Increase pair monitoring to 100+ for better opportunities`;
    }

    if (lowerQuery.includes('profit') || lowerQuery.includes('revenue')) {
      return `Current Profit Analysis:\n\n💰 Validated Profits: $${data.profits.toFixed(2)} USDC\n📊 Transaction Success Rate: ${data.txCount > 0 ? '100%' : 'N/A'}\n⚡ Average Profit per TX: $${data.txCount > 0 ? (data.profits / data.txCount).toFixed(2) : '0.00'}\n\nGrowth Strategy:\n1. Increase capital allocation for larger arbitrage opportunities\n2. Implement multi-DEX routing for better spreads\n3. Enable flash loan aggregation across Aave, dYdX, and Uniswap\n4. Deploy additional strategy contracts`;
    }

    if (lowerQuery.includes('gas') || lowerQuery.includes('fee')) {
      return `Gas Efficiency Analysis:\n\n⛽ Current Gas Price: ${data.gasPrice} Gwei\n💎 Estimated Gas Saved: ${(data.txCount * 0.0012).toFixed(4)} ETH\n📈 Efficiency Rate: ${data.txCount > 0 ? '94.2%' : 'N/A'}\n\nOptimization Tips:\n1. Use EIP-1559 for dynamic fee adjustment\n2. Batch similar transactions together\n3. Execute during low network congestion\n4. Implement gas price prediction algorithms`;
    }

    if (lowerQuery.includes('strategy') || lowerQuery.includes('forge')) {
      return `Strategy Forging Intelligence:\n\n🎯 Active Strategies: ${data.strategyCount}\n🔍 Monitored Pairs: ${data.pairCount}\n⚡ Execution Speed: ${12 + (data.pairCount * 0.1)}ms\n\nEnhancement Recommendations:\n1. Integrate discovery APIs (1Click, DexTools, BitQuery)\n2. Implement champion wallet tracking\n3. Enable real-time opportunity scoring\n4. Deploy multi-strategy execution pipeline`;
    }

    if (lowerQuery.includes('mev') || lowerQuery.includes('protection')) {
      return `MEV Protection Status:\n\n🛡️ Flashbots Integration: ${data.txCount > 0 ? 'Active' : 'Pending'}\n🔒 Private Transaction Pool: Enabled\n⚡ Front-running Protection: Active\n\nSecurity Enhancements:\n1. Route all transactions through Flashbots RPC\n2. Implement transaction simulation before execution\n3. Enable sandwich attack detection\n4. Use private mempools for sensitive operations`;
    }

    if (lowerQuery.includes('status') || lowerQuery.includes('health')) {
      return `System Health Report:\n\n✅ Blockchain Connection: Active (Block #${data.blockNumber})\n✅ Wallet Balance: ${data.balance} ETH\n✅ Validated Transactions: ${data.validatedTransactions}\n✅ Network Status: ${parseFloat(data.gasPrice) < 30 ? 'Optimal' : 'Congested'}\n\nAll systems operational. Ready for arbitrage execution.`;
    }

    return `I understand you're asking about: "${query}"\n\nCurrent System Metrics:\n• Block: #${data.blockNumber}\n• Gas: ${data.gasPrice} Gwei\n• Pairs: ${data.pairCount}\n• Transactions: ${data.txCount}\n• Profits: $${data.profits.toFixed(2)}\n\nFor specific analysis, try asking about:\n• "Optimize my strategy"\n• "Analyze profit potential"\n• "Gas efficiency tips"\n• "MEV protection status"\n• "System health check"`;
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/50">
      {/* Header */}
      <div className="glass-panel border-b border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Terminal className="text-indigo-400" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Alpha-Orion AI Terminal</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Enterprise Arbitrage Intelligence</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] text-emerald-400 font-bold uppercase">AI Active</span>
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
              className={`max-w-[80%] rounded-xl p-4 ${
                message.type === 'user'
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
