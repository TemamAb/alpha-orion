import React from 'react';
import { BotRole, BotStatus, BotState, Strategy, WalletStats, ChampionWallet } from '../types';
import { RealTimeData } from '../services/productionDataService';

interface DashboardProps {
  wallet: WalletStats;
  bots: BotState[];
  strategies: Strategy[];
  champions: ChampionWallet[];
  aiInsight: string;
  realTimeData: RealTimeData;
  activeView: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  wallet,
  bots,
  strategies,
  champions,
  aiInsight,
  realTimeData,
  activeView
}) => {
  const renderContent = () => {
    switch (activeView) {
      case 'core-metrics':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Core Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-slate-400">Balance</h3>
                <p className="text-2xl font-bold text-emerald-400">{realTimeData.balance} USDC</p>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-slate-400">Profits</h3>
                <p className="text-2xl font-bold text-emerald-400">${realTimeData.profits.toFixed(2)}</p>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-slate-400">Transactions</h3>
                <p className="text-2xl font-bold text-blue-400">{realTimeData.txCount}</p>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-slate-400">Pairs</h3>
                <p className="text-2xl font-bold text-purple-400">{realTimeData.pairCount}</p>
              </div>
            </div>
          </div>
        );

      case 'ai-optimization':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">AI Optimization Engine</h2>
            <div className="bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-300">{aiInsight || 'AI insights will appear here...'}</p>
            </div>
          </div>
        );

      case 'bot-fleets':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Bot Fleets</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bots.map((bot) => (
                <div key={bot.id} className="bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-white">{bot.role}</h3>
                  <p className="text-sm text-slate-400">Status: {bot.status}</p>
                  <p className="text-sm text-slate-400">CPU: {bot.cpuUsage}%</p>
                  <p className="text-xs text-slate-500">{bot.lastAction}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'latency-metrics':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Execution Latency</h2>
            <div className="bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-300">Latency metrics will be displayed here.</p>
            </div>
          </div>
        );

      case 'gas-metrics':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Gas Optimization</h2>
            <div className="bg-slate-800 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-400">Current Gas Price</h3>
              <p className="text-2xl font-bold text-amber-400">{realTimeData.gasPrice} Gwei</p>
            </div>
          </div>
        );

      case 'profit-reinvestment':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Profit Reinvestment</h2>
            <div className="bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-300">Reinvestment strategies will be shown here.</p>
            </div>
          </div>
        );

      case 'champion-discovery':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Champion Discovery</h2>
            <div className="space-y-4">
              {champions.map((champion) => (
                <div key={champion.id} className="bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-white">{champion.address.substring(0, 10)}...</h3>
                  <p className="text-sm text-slate-400">Profit/Day: {champion.profitPerDay}</p>
                  <p className="text-sm text-slate-400">Win Rate: {champion.winRate}</p>
                  <p className="text-sm text-slate-400">Status: {champion.forgedStatus}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'deployment-registry':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Deployment Registry</h2>
            <div className="bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-300">Deployment registry will be displayed here.</p>
            </div>
          </div>
        );

      case 'profit-withdrawal':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Profit Withdrawal</h2>
            <div className="bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-300">Withdrawal options will be available here.</p>
            </div>
          </div>
        );

      case 'flash-loan-providers':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Flash Loan Providers</h2>
            <div className="bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-300">Flash loan provider information will be shown here.</p>
            </div>
          </div>
        );

      case 'blockchain-streaming':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Blockchain Event Streaming</h2>
            <div className="bg-slate-800 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-400">Current Block</h3>
              <p className="text-2xl font-bold text-cyan-400">#{realTimeData.blockNumber}</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Dashboard</h2>
            <div className="bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-300">Select a view from the sidebar to see metrics.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {renderContent()}
    </div>
  );
};

export default Dashboard;
