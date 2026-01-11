import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, ExternalLink, Shield, TrendingUp } from 'lucide-react';
import type { TransactionValidation, ValidatedProfitSummary } from '../services/profitValidationService';

/**
 * VALIDATED PROFIT DISPLAY COMPONENT
 * 
 * Displays only Etherscan-validated profits on monitoring metrics.
 * Ensures transparency and accuracy by verifying all transactions on-chain.
 */

interface ValidatedProfitDisplayProps {
  validatedSummary: ValidatedProfitSummary;
  recentTransactions: TransactionValidation[];
  onRefresh?: () => void;
}

export const ValidatedProfitDisplay: React.FC<ValidatedProfitDisplayProps> = ({
  validatedSummary,
  recentTransactions,
  onRefresh
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Validated Profit Summary */}
      <div className="glass-panel rounded-[1.5rem] border border-emerald-500/20 p-6 bg-gradient-to-br from-emerald-500/5 to-transparent">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-md font-bold text-white uppercase tracking-tight flex items-center gap-2">
                Validated Profits
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-black text-emerald-400">
                  ETHERSCAN VERIFIED
                </span>
              </h3>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                On-Chain Confirmation Required
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-white/5 rounded-xl hover:border-emerald-500/30 transition-all disabled:opacity-50"
          >
            <CheckCircle 
              size={14} 
              className={`text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
              {isRefreshing ? 'Validating...' : 'Refresh'}
            </span>
          </button>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                Total Validated Profit
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-black text-emerald-400 tracking-tight">
                {validatedSummary.totalProfit}
              </h4>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-1">
              {validatedSummary.totalProfitUSD}
            </p>
          </div>

          <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={14} className="text-indigo-400" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                Validated Transactions
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-black text-white tracking-tight">
                {validatedSummary.validatedTransactions}
              </h4>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-1">
              {validatedSummary.pendingValidation} pending
            </p>
          </div>

          <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} className="text-amber-400" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                Validation Rate
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-black text-white tracking-tight">
                {validatedSummary.validationRate.toFixed(1)}%
              </h4>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000" 
                style={{ width: `${validatedSummary.validationRate}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Validation Status Banner */}
        <div className={`p-4 rounded-xl border ${
          validatedSummary.validationRate === 100
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : validatedSummary.validationRate >= 95
            ? 'bg-indigo-500/5 border-indigo-500/20'
            : 'bg-amber-500/5 border-amber-500/20'
        }`}>
          <div className="flex items-center gap-3">
            {validatedSummary.validationRate === 100 ? (
              <CheckCircle size={16} className="text-emerald-400" />
            ) : validatedSummary.validationRate >= 95 ? (
              <Clock size={16} className="text-indigo-400" />
            ) : (
              <AlertCircle size={16} className="text-amber-400" />
            )}
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${
                validatedSummary.validationRate === 100
                  ? 'text-emerald-400'
                  : validatedSummary.validationRate >= 95
                  ? 'text-indigo-400'
                  : 'text-amber-400'
              }`}>
                {validatedSummary.validationRate === 100
                  ? 'All Profits Validated'
                  : validatedSummary.validationRate >= 95
                  ? 'Validation In Progress'
                  : 'Pending Validation'}
              </p>
              <p className="text-[8px] text-slate-400 font-medium mt-0.5">
                {validatedSummary.validationRate === 100
                  ? 'All transactions have been verified on Etherscan'
                  : `${validatedSummary.pendingValidation} transaction(s) awaiting blockchain confirmation`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Validated Transactions */}
      <div className="glass-panel rounded-[1.5rem] border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
            Recent Validated Transactions
          </h4>
        </div>

        <div className="divide-y divide-white/5">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <Clock size={24} className="text-slate-600 mx-auto mb-3" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                No validated transactions yet
              </p>
            </div>
          ) : (
            recentTransactions.map((tx) => (
              <div
                key={tx.txHash}
                className="p-4 hover:bg-white/[0.01] transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {tx.validated && tx.status === 'success' ? (
                        <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                      ) : tx.status === 'pending' ? (
                        <Clock size={14} className="text-amber-400 flex-shrink-0 animate-pulse" />
                      ) : (
                        <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
                      )}
                      <span className="text-[10px] font-mono text-slate-400 truncate">
                        {tx.txHash}
                      </span>
                      <a
                        href={tx.etherscanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[9px]">
                      <div>
                        <span className="text-slate-600 font-bold uppercase block mb-0.5">
                          Profit
                        </span>
                        <span className="text-emerald-400 font-black">
                          {tx.profit}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 font-bold uppercase block mb-0.5">
                          USD Value
                        </span>
                        <span className="text-white font-bold">
                          {tx.profitUSD}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 font-bold uppercase block mb-0.5">
                          Gas Cost
                        </span>
                        <span className="text-slate-400 font-bold">
                          {tx.gasCost}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 font-bold uppercase block mb-0.5">
                          Net Profit
                        </span>
                        <span className="text-indigo-400 font-black">
                          {tx.netProfit}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${
                      tx.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : tx.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {tx.status}
                    </span>
                    <span className="text-[8px] text-slate-600 font-bold">
                      Block #{tx.blockNumber}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Validation Info */}
      <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
        <div className="flex items-start gap-3">
          <Shield size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">
              Etherscan Validation
            </h5>
            <p className="text-[8px] text-slate-400 leading-relaxed">
              All profits displayed on monitoring metrics are validated through Etherscan before being shown. 
              This ensures complete transparency and accuracy by verifying each transaction on-chain. 
              Pending transactions will appear once blockchain confirmation is received.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidatedProfitDisplay;
