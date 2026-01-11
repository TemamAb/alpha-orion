import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BotRole, BotStatus, BotState, Strategy, WalletStats, ChampionWallet } from './types';
import { forgeEnterpriseAlpha } from './services/geminiService';
import { ProductionDataService, RealTimeData } from './services/productionDataService';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import WalletManager from './components/WalletManager';
import { 
  Sparkles, LayoutDashboard
} from 'lucide-react';

const App: React.FC = () => {
  // Production data service
  const [productionService, setProductionService] = useState<ProductionDataService | null>(null);
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    balance: '0.00',
    profits: 0,
    txCount: 0,
    pairCount: 0,
    strategyCount: 0,
    blockNumber: 0,
    gasPrice: '0',
    validatedTransactions: 0
  });

  // Initialize with ZERO metrics - will be populated by real blockchain data
  const [bots, setBots] = useState<BotState[]>([
    { id: 'bot-1', role: BotRole.ORCHESTRATOR, status: BotStatus.IDLE, lastAction: 'Initializing...', uptime: 0, cpuUsage: 0 },
    { id: 'bot-2', role: BotRole.SCANNER, status: BotStatus.IDLE, lastAction: 'Standby', uptime: 0, cpuUsage: 0 },
    { id: 'bot-3', role: BotRole.EXECUTOR, status: BotStatus.IDLE, lastAction: 'Ready', uptime: 0, cpuUsage: 0 },
  ]);

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [champions, setChampions] = useState<ChampionWallet[]>([]);
  
  // Initialize wallet stats with ZERO values - will be updated by real data
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

  // Initialize ProductionDataService on mount
  useEffect(() => {
    const initService = async () => {
      try {
        const service = new ProductionDataService('ARBITRUM_SEPOLIA');
        await service.initialize();
        setProductionService(service);
        console.log('✅ ProductionDataService initialized');
      } catch (error) {
        console.error('❌ Failed to initialize ProductionDataService:', error);
      }
    };

    initService();
  }, []);

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
      aave_liquidity: realTimeData.balance ? parseFloat(realTimeData.balance) : 0,
      active_integrations: ["1Click", "DexTools", "BitQuery", "EtherscanPro"],
      network_load: "Low",
      mempool_volatility: "0.00%"
    });
    
    if (alpha.strategies.length > 0) {
      setStrategies(alpha.strategies);
    }
    
    setIsAIThinking(false);
  }, [isEngineRunning, realTimeData.balance]);

  // Monitor wallet for real-time blockchain data
  useEffect(() => {
    if (!connectedWallet || !productionService || !isEngineRunning) {
      return;
    }

    let cleanup: (() => void) | undefined;

    const setupMonitoring = async () => {
      try {
        cleanup = await productionService.monitorWallet(connectedWallet, (data) => {
          setRealTimeData(data);
          
          // Update bot CPU usage based on real activity
          setBots(prev => prev.map(bot => ({
            ...bot,
            cpuUsage: bot.status !== BotStatus.IDLE ? Math.min(data.txCount * 2, 95) : 0,
            status: bot.role === BotRole.SCANNER && data.pairCount > 0 ? BotStatus.SCANNING : 
                    bot.role === BotRole.ORCHESTRATOR && data.strategyCount > 0 ? BotStatus.FORGING : 
                    bot.role === BotRole.EXECUTOR && data.txCount > 0 ? BotStatus.EXECUTING : BotStatus.IDLE
          })));
        });
      } catch (error) {
        console.error('Error setting up wallet monitoring:', error);
      }
    };

    setupMonitoring();

    return () => {
      if (cleanup) cleanup();
    };
  }, [connectedWallet, productionService, isEngineRunning]);

  useEffect(() => {
    // Only start forging when engine is running
    if (!isEngineRunning) {
      return;
    }

    runAlphaForge();
    
    // Update bot status periodically based on real data
    const botInterval = setInterval(() => {
      if (realTimeData.pairCount > 0 || realTimeData.txCount > 0) {
        setBots(prev => prev.map(bot => ({
          ...bot,
          status: bot.role === BotRole.SCANNER && realTimeData.pairCount > 0 ? BotStatus.SCANNING : 
                  bot.role === BotRole.ORCHESTRATOR && realTimeData.strategyCount > 0 ? BotStatus.FORGING : 
                  bot.role === BotRole.EXECUTOR && realTimeData.txCount > 0 ? BotStatus.EXECUTING : BotStatus.IDLE
        })));
      }
    }, 5000);
    
    return () => clearInterval(botInterval);
  }, [runAlphaForge, isEngineRunning, realTimeData]);

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

                {/* Real-time Blockchain Stats */}
                {isEngineRunning && (
                  <div className="pt-6 border-t border-slate-900">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-4 mb-3">Live Blockchain Data</p>
                    <div className="px-4 space-y-2">
                      <div className="flex justify-between text-[8px]">
                        <span className="text-slate-500 font-bold uppercase">Block</span>
                        <span className="text-emerald-400 font-mono">#{realTimeData.blockNumber}</span>
                      </div>
                      <div className="flex justify-between text-[8px]">
                        <span className="text-slate-500 font-bold uppercase">Gas</span>
                        <span className="text-amber-400 font-mono">{parseFloat(realTimeData.gasPrice).toFixed(2)} Gwei</span>
                      </div>
                      <div className="flex justify-between text-[8px]">
                        <span className="text-slate-500 font-bold uppercase">Pairs</span>
                        <span className="text-indigo-400 font-mono">{realTimeData.pairCount}</span>
                      </div>
                      <div className="flex justify-between text-[8px]">
                        <span className="text-slate-500 font-bold uppercase">Validated TX</span>
                        <span className="text-cyan-400 font-mono">{realTimeData.validatedTransactions}</span>
                      </div>
                    </div>
                  </div>
                )}
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
                  <span className="text-[9px] text-slate-600 uppercase font-black">Validated Profit</span>
                  <p className="text-emerald-400 font-black text-xs leading-none">${realTimeData.profits.toFixed(2)} USDC</p>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <Routes>
                <Route path="/" element={
                  <Dashboard 
                    wallet={wallet} 
                    bots={bots} 
                    strategies={strategies} 
                    champions={champions} 
                    aiInsight="" 
                    realTimeData={realTimeData}
                  />
                } />
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
