import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, Clock, Copy, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface Deployment {
  id: string;
  deploymentCode: string;
  date: string;
  timestamp: number;
  smartWalletAddress: string;
  contractNumber: string;
  status: 'active' | 'inactive';
  network: string;
  gasUsed: string;
  transactionHash: string;
}

interface DeploymentRegistryProps {
  connectedWallet?: string;
}

const DeploymentRegistry: React.FC<DeploymentRegistryProps> = ({ connectedWallet }) => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Deployment; direction: 'asc' | 'desc' }>({
    key: 'timestamp',
    direction: 'desc'
  });
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Load deployments from localStorage (persisted between sessions)
  useEffect(() => {
    const loadDeployments = () => {
      const stored = localStorage.getItem('alpha_deployments');
      if (stored) {
        setDeployments(JSON.parse(stored));
      } else {
        setDeployments([]);
      }
    };

    loadDeployments();
    // Add event listener to handle updates from other components
    window.addEventListener('storage', loadDeployments);
    return () => window.removeEventListener('storage', loadDeployments);
  }, [connectedWallet]);

  const sortedDeployments = React.useMemo(() => {
    let sortable = [...deployments];
    sortable.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortable;
  }, [deployments, sortConfig]);

  const toggleSort = (key: keyof Deployment) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(id);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const SortIcon = ({ col }: { col: keyof Deployment }) => (
    <div className="inline-flex flex-col ml-1.5 align-middle">
      <ChevronUp size={8} className={`${sortConfig.key === col && sortConfig.direction === 'asc' ? 'text-indigo-400' : 'text-slate-600'}`} />
      <ChevronDown size={8} className={`${sortConfig.key === col && sortConfig.direction === 'desc' ? 'text-indigo-400' : 'text-slate-600'}`} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
            <Database size={14} className="text-cyan-400" /> Deployment Registry
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block">Total Deployments</span>
            <span className="text-[11px] font-black text-cyan-400 tracking-tighter">{deployments.length}</span>
          </div>
          <div className="text-right">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block">Active</span>
            <span className="text-[11px] font-black text-emerald-400 tracking-tighter">
              {deployments.filter(d => d.status === 'active').length}
            </span>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-[1.5rem] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="bg-slate-900/40 border-b border-white/5 sticky top-0 z-10">
              <tr>
                <th
                  onClick={() => toggleSort('status')}
                  className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-300 transition-colors min-w-[100px]"
                >
                  Status <SortIcon col="status" />
                </th>
                <th
                  onClick={() => toggleSort('deploymentCode')}
                  className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-300 transition-colors min-w-[150px]"
                >
                  Deployment Code <SortIcon col="deploymentCode" />
                </th>
                <th
                  onClick={() => toggleSort('date')}
                  className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-300 transition-colors min-w-[180px]"
                >
                  Date & Time <SortIcon col="date" />
                </th>
                <th
                  onClick={() => toggleSort('smartWalletAddress')}
                  className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-300 transition-colors min-w-[200px]"
                >
                  Smart Wallet <SortIcon col="smartWalletAddress" />
                </th>
                <th
                  onClick={() => toggleSort('contractNumber')}
                  className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-300 transition-colors min-w-[120px]"
                >
                  Contract # <SortIcon col="contractNumber" />
                </th>
                <th
                  onClick={() => toggleSort('network')}
                  className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-300 transition-colors min-w-[150px]"
                >
                  Network <SortIcon col="network" />
                </th>
                <th
                  onClick={() => toggleSort('gasUsed')}
                  className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-300 transition-colors text-right min-w-[120px]"
                >
                  Gas Used <SortIcon col="gasUsed" />
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest min-w-[100px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDeployments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Database size={32} className="text-slate-600" />
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        No deployments registered yet
                      </p>
                      <p className="text-[8px] text-slate-600 font-medium">
                        Deploy your first contract to see it here
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedDeployments.map((deployment) => (
                  <tr
                    key={deployment.id}
                    className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-all group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {deployment.status === 'active' ? (
                          <>
                            <CheckCircle size={14} className="text-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <Clock size={14} className="text-slate-600" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              Inactive
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[10px] font-mono font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                        {deployment.deploymentCode}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[10px] font-mono text-slate-300 group-hover:text-white transition-colors">
                        {deployment.date}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-mono text-slate-400 group-hover:text-slate-200 transition-colors cursor-pointer"
                          title={deployment.smartWalletAddress}
                        >
                          {formatAddress(deployment.smartWalletAddress)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(deployment.smartWalletAddress, deployment.id)}
                          className="p-1 hover:bg-white/5 rounded transition-colors"
                          title="Copy address"
                        >
                          {copiedAddress === deployment.id ? (
                            <CheckCircle size={12} className="text-emerald-400" />
                          ) : (
                            <Copy size={12} className="text-slate-600 hover:text-slate-400" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                        {deployment.contractNumber}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[10px] font-medium text-slate-300">
                        {deployment.network}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-[10px] font-bold text-amber-400 tracking-tight">
                        {deployment.gasUsed}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`https://sepolia.arbiscan.io/tx/${deployment.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg transition-all group/link"
                        title="View on Arbiscan"
                      >
                        <ExternalLink size={10} className="text-indigo-400 group-hover/link:text-indigo-300" />
                        <span className="text-[8px] font-bold text-indigo-400 group-hover/link:text-indigo-300 uppercase tracking-widest">
                          View
                        </span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {sortedDeployments.length > 0 && (
          <div className="px-4 py-3 bg-slate-900/20 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                Live Registry - Auto-updates on new deployments
              </span>
            </div>
            <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">
              Scroll horizontally to view all columns
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 px-4 py-3 bg-slate-900/20 border border-white/5 rounded-xl">
        <div className="flex items-center gap-2">
          <CheckCircle size={12} className="text-emerald-500" />
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Deployment</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-slate-600" />
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Previous Deployment</span>
        </div>
        <div className="flex items-center gap-2">
          <ExternalLink size={12} className="text-indigo-400" />
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">View on Arbiscan</span>
        </div>
      </div>
    </div>
  );
};

export default DeploymentRegistry;
