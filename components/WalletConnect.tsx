import React, { useState } from 'react';
import { 
  Wallet, Check, AlertCircle, Loader, ExternalLink, 
  Power, Shield, Activity, Zap, ChevronRight, Copy,
  CheckCircle, Clock
} from 'lucide-react';
import { walletService, WalletConnection, DeploymentRecord } from '../services/walletService';

interface WalletConnectProps {
  onConnectionChange: (connected: boolean, address?: string) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnectionChange }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deploymentRecord, setDeploymentRecord] = useState<DeploymentRecord | null>(null);
  const [networkName, setNetworkName] = useState<string>('Unknown');
  const [showDeploymentDetails, setShowDeploymentDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  // User must click button to connect - no auto-connection

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const conn = await walletService.connectWallet();
      setConnection(conn);
      
      const network = await walletService.getNetworkName();
      setNetworkName(network);

      // Validate connection
      const isValid = await walletService.validateConnection(conn.address);
      if (!isValid) {
        throw new Error('Wallet validation failed');
      }

      onConnectionChange(true, conn.address);
    } catch (err: any) {
      setError(err.message);
      onConnectionChange(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    walletService.disconnect();
    setConnection(null);
    setDeploymentRecord(null);
    setNetworkName('Unknown');
    onConnectionChange(false);
  };

  const handleDeploy = async () => {
    if (!connection) return;

    setIsDeploying(true);
    setError(null);

    try {
      // Check if on mainnet, if not switch
      if (connection.chainId !== 1) {
        await walletService.switchToMainnet();
        // Reconnect after network switch
        const conn = await walletService.connectWallet();
        setConnection(conn);
      }

      const record = await walletService.deployEngine(connection.address);
      setDeploymentRecord(record);
      setShowDeploymentDetails(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (!walletService.isMetaMaskInstalled()) {
    return (
      <div className="glass-panel rounded-2xl border border-rose-500/20 p-6 bg-rose-500/5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl">
            <AlertCircle size={24} className="text-rose-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
              MetaMask Not Detected
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
              Please install MetaMask browser extension to connect your wallet and deploy the arbitrage engine.
            </p>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
            >
              Install MetaMask <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="glass-panel rounded-2xl border border-white/5 p-6 hover:border-indigo-500/30 transition-all">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Wallet size={20} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Connect Wallet
              </h3>
              <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">
                Deploy Engine to Mainnet
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2">
            <AlertCircle size={14} className="text-rose-400 mt-0.5" />
            <p className="text-[9px] text-rose-300 leading-relaxed">{error}</p>
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20"
        >
          {isConnecting ? (
            <>
              <Loader size={16} className="animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet size={16} />
              Connect MetaMask
            </>
          )}
        </button>

        <div className="mt-4 p-3 bg-white/[0.01] border border-white/5 rounded-xl">
          <p className="text-[8px] text-slate-500 leading-relaxed">
            <Shield size={10} className="inline mr-1" />
            Your wallet will be used to deploy and manage the flash loan arbitrage engine on Ethereum mainnet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connected Wallet Info */}
      <div className="glass-panel rounded-2xl border border-emerald-500/20 p-6 bg-emerald-500/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <CheckCircle size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Wallet Connected
              </h3>
              <p className="text-[8px] text-emerald-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <Activity size={8} className="animate-pulse" />
                {networkName}
              </p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="p-2 hover:bg-white/5 rounded-lg transition-all group"
            title="Disconnect"
          >
            <Power size={16} className="text-slate-500 group-hover:text-rose-400 transition-colors" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Address</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-white">{formatAddress(connection.address)}</span>
              <button
                onClick={() => copyToClipboard(connection.address)}
                className="p-1 hover:bg-white/5 rounded transition-all"
              >
                {copied ? (
                  <Check size={12} className="text-emerald-400" />
                ) : (
                  <Copy size={12} className="text-slate-500" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Balance</span>
            <span className="text-[10px] font-bold text-emerald-400">{connection.balance}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Chain ID</span>
            <span className="text-[10px] font-bold text-white">{connection.chainId}</span>
          </div>
        </div>
      </div>

      {/* Deployment Section */}
      {!deploymentRecord ? (
        <div className="glass-panel rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Zap size={20} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Deploy Engine
              </h3>
              <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">
                Initialize on Ethereum Mainnet
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2">
              <AlertCircle size={14} className="text-rose-400 mt-0.5" />
              <p className="text-[9px] text-rose-300 leading-relaxed">{error}</p>
            </div>
          )}

          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-600/20"
          >
            {isDeploying ? (
              <>
                <Loader size={16} className="animate-spin" />
                Deploying to Mainnet...
              </>
            ) : (
              <>
                <Zap size={16} />
                Deploy Arbitrage Engine
                <ChevronRight size={16} />
              </>
            )}
          </button>

          <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
            <p className="text-[8px] text-amber-300 leading-relaxed">
              <Clock size={10} className="inline mr-1" />
              Deployment will initialize the flash loan arbitrage engine on Ethereum mainnet. Estimated time: ~30 seconds.
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-emerald-500/20 p-6 bg-emerald-500/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 relative">
                <CheckCircle size={20} className="text-emerald-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  Engine Running
                  <Activity size={12} className="animate-pulse" />
                </h3>
                <p className="text-[8px] text-slate-400 uppercase tracking-widest mt-0.5">
                  Deployed Successfully
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDeploymentDetails(!showDeploymentDetails)}
              className="text-[8px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
            >
              {showDeploymentDetails ? 'Hide' : 'Show'} Details
            </button>
          </div>

          {showDeploymentDetails && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Deployment ID</span>
                <span className="text-[9px] font-mono text-white">{deploymentRecord.id}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Transaction Hash</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-white">{formatAddress(deploymentRecord.transactionHash)}</span>
                  <button
                    onClick={() => copyToClipboard(deploymentRecord.transactionHash)}
                    className="p-1 hover:bg-white/5 rounded transition-all"
                  >
                    {copied ? (
                      <Check size={10} className="text-emerald-400" />
                    ) : (
                      <Copy size={10} className="text-slate-500" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Block Number</span>
                <span className="text-[9px] font-bold text-white">{deploymentRecord.blockNumber?.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Gas Used</span>
                <span className="text-[9px] font-bold text-emerald-400">{deploymentRecord.gasUsed} ETH</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Timestamp</span>
                <span className="text-[9px] font-bold text-white">{deploymentRecord.timestamp.toLocaleTimeString()}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Status</span>
                <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase">
                  <CheckCircle size={10} />
                  {deploymentRecord.status}
                </span>
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <p className="text-[8px] text-emerald-300 leading-relaxed">
              <Shield size={10} className="inline mr-1" />
              The arbitrage engine is now live on Ethereum mainnet. Disconnect wallet to stop the engine.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
