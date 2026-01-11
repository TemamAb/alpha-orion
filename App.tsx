import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BotRole, BotStatus, BotState, Strategy, WalletStats, ChampionWallet } from './types';
import { forgeEnterpriseAlpha } from './services/geminiService';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import WalletManager from './components/WalletManager';
import { 
  Sparkles, LayoutDashboard
} from 'lucide-react';

const App: React.FC = () => {
  // Initialize with ZERO metrics for production deployment
  const [bots, setBots] = useState<BotState[]>([
    { id: 'bot-1', role: BotRole.ORCHESTRATOR, status: BotStatus.IDLE, lastAction: 'Initializing...', uptime: 0, cpuUsage: 0 },
    { id: 'bot-2', role: BotRole.SCANNER, status: BotStatus.IDLE, lastAction: 'Standby', uptime: 0, cpuUsage: 0 },
    { id: 'bot-3', role: BotRole.EXECUTOR, status: BotStatus.IDLE, lastAction: 'Ready', uptime: 0, cpuUsage: 0 },
  ]);

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [champions, setChampions] = useState<ChampionWallet[]>([]);
  
  // Initialize wallet stats with ZERO values
  const [wallet] = useState<WalletStats>({
    address: 'Not Connected',
    balance: '0.00 USDC',
    totalProfit: '0.00 USDC',
    gasSaved: '0.00 USDC',
    accountType: 'ERC-4337 (Pimlico)'
  });
  
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string>('');
  const [isEngineRunning, setIsEngineRunning] = useState(false);

  const handleWalletChange = (address: string) => {
    setConnectedWallet(address);
    setIsEngineRunning(!!address);
    
    // Only start bot activity when engine is running
    if (address) {
      startBotActivity();
    } else {
      stopBotActivity();
    }
  };

  const startBotActivity = () => {
    // Bots become active only after deployment
    setBots(prev => prev.map(bot => ({
      ...bot,
      status: bot.role === BotRole.SCANNER ? BotStatus.SCANNING : BotStatus.IDLE,
      lastAction: bot.role === BotRole.SCANNER ? 'Scanning mempool...' : 'Awaiting signal',
    })));
  };

  const stopBotActivity = () => {
    // Reset bots to idle state
    setBots(prev => prev.map(bot => ({
      ...bot,
      status: BotStatus.IDLE,
      lastAction: 'Standby',
      cpuUsage: 0
    })));
  };

  const runAlphaForge = useCallback(async () => {
    // Only run if engine is deployed
    if (!isEngineRunning) {
      return;
    }

    setIsAIThinking(true);
    const alpha = await forgeEnterpriseAlpha({ 
      aave_liquidity: 0, // Start with zero, will be updated by real data
      active_integrations: ["1Click", "DexTools", "BitQuery", "EtherscanPro"],
      network_load: "Low",
      mempool_volatility: "0.00%"
    });
    
    if (alpha.strategies.length > 0) {
      setStrategies(alpha.strategies);
    }
    
    setIsAIThinking(false);
  }, [isEngineRunning]);

  useEffect(() => {
    // Only start forging and bot updates when engine is running
    if (!isEngineRunning) {
      return;
    }

    runAlphaForge();
    
    const botInterval = setInterval(() => {
      setBots(prev => prev.map(bot => ({
        ...bot,
        status: bot.role === BotRole.SCANNER ? BotStatus.SCANNING : 
                bot.role === BotRole.ORCHESTRATOR ? BotStatus.FORGING : BotStatus.IDLE,
        cpuUsage: Math.floor(Math.random() * 30) + 5 // Realistic CPU usage
      })));
    }, 5000);
    
    return () => clearInterval(botInterval);
  }, [runAlphaForge, isEngineRunning]);

  return (
    <ErrorBoundary>
      <HashRouter>
        <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200 font-sans">
          <aside className="w-80 glass-panel border-r border-slate-800 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="p-6">
              <div className="flex items-center gap-3 text-indigo-500 mb-10 px-2">
                <Sparkles className="fill-current text-indigo-400 shadow-indigo-500/20" size={20} />
                <h1 className="text-lg font-black tracking-tight text-white uppercase italic">ARBINEXUS</h1>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-4 mb-3">System Control</p>
                  <nav className="space-y-1">
                    <SidebarLink to="/" icon={<LayoutDashboard size={16} />} label="Command Center" />
                  </nav>
                </div>

                {/* Wallet Manager Section */}
                <div className="pt-6 border-t border-slate-900">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-4 mb-3">Wallet Configuration</p>
                  <WalletManager onWalletChange={handleWalletChange} />
                </div>
              </div>
            </div>

            <div className="mt-auto p-6 border-t border-slate-900 bg-black/20">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full animate-pulse ${isEngineRunning ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                <div className="flex-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                    {isEngineRunning ? 'Engine Running' : 'Cluster Online'}
                  </span>
                  {connectedWallet && (
                    <span className="text-[7px] font-bold text-slate-600 uppercase block mt-1">
                      {connectedWallet.substring(0, 6)}...{connectedWallet.substring(connectedWallet.length - 4)}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[8px] font-bold text-slate-600 uppercase mt-2">Enterprise Logic v4.2</p>
            </div>
          </aside>

          <main className="flex-1 flex flex-col overflow-hidden bg-slate-950/50">
            <header className="h-14 glass-panel border-b border-slate-900 flex items-center justify-between px-8">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                System Command Hub
              </h2>
              <div className="flex items-center gap-6">
                {isAIThinking && <span className="text-[8px] text-indigo-400 font-black animate-pulse uppercase tracking-[0.2em]">AI Syncing Discovery...</span>}
                <div className="text-right">
                  <span className="text-[9px] text-slate-600 uppercase font-black">Cluster Yield</span>
                  <p className="text-emerald-400 font-black text-xs leading-none">{wallet.totalProfit}</p>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <Routes>
                <Route path="/" element={<Dashboard wallet={wallet} bots={bots} strategies={strategies} champions={champions} aiInsight="" />} />
              </Routes>
            </div>
          </main>
        </div>
      </HashRouter>
    </ErrorBoundary>
  );
};

const SidebarLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to === '/' && (location.pathname === '' || location.pathname === '/'));
  return (
    <Link to={to} className={`flex items-center justify-between px-4 py-2 rounded-xl transition-all ${isActive ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'}`}>
      <div className="flex items-center gap-3">{icon}<span className="text-[11px] font-bold">{label}</span></div>
    </Link>
  );
};

export default App;
