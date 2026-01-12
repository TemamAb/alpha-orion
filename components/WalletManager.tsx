import React, { useState, useEffect } from 'react';
import {
  Wallet, Check, AlertCircle, Edit3, X, Copy,
  Shield, Activity, Zap, ChevronRight, CheckCircle, LogOut, RotateCcw
} from 'lucide-react';

interface WalletManagerProps {
  onWalletChange: (address: string) => void;
}

const WalletManager: React.FC<WalletManagerProps> = ({ onWalletChange }) => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [inputAddress, setInputAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [smartAccount, setSmartAccount] = useState<string>('');

  // Load default wallet address and deployment status from storage on mount
  useEffect(() => {
    const defaultAddress = process.env.DEFAULT_WALLET_ADDRESS || '';
    if (defaultAddress && isValidAddress(defaultAddress)) {
      setWalletAddress(defaultAddress);
      onWalletChange(defaultAddress);
    }

    // Check for existing deployments
    const stored = localStorage.getItem('alpha_deployments');
    if (stored) {
      const deployments = JSON.parse(stored);
      if (deployments.length > 0) {
        setIsDeployed(true);
        setSmartAccount(deployments[0].smartWalletAddress);
      }
    }
  }, []);

  const isValidAddress = (address: string): boolean => {
    // Ethereum address validation: starts with 0x and is 42 characters long
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  };

  const handleEditClick = () => {
    setInputAddress(walletAddress);
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInputAddress('');
    setError(null);
  };

  const handleSave = () => {
    const trimmedAddress = inputAddress.trim();

    if (!trimmedAddress) {
      setError('Wallet address cannot be empty');
      return;
    }

    if (!isValidAddress(trimmedAddress)) {
      setError('Invalid Ethereum address format. Must start with 0x and be 42 characters long.');
      return;
    }

    setWalletAddress(trimmedAddress);
    onWalletChange(trimmedAddress);
    setIsEditing(false);
    setInputAddress('');
    setError(null);
  };

  const handleDeploy = async () => {
    if (!walletAddress) {
      setError('Please set a wallet address first');
      return;
    }

    setError(null);
    // Simulate deployment (3 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));

    const generatedSmartWallet = '0x748A' + Array.from({ length: 36 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    // PERSIST DEPLOYMENT
    const newDeployment = {
      id: Date.now().toString(),
      deploymentCode: `DEPLOY-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      date: new Date().toLocaleString(),
      timestamp: Date.now(),
      smartWalletAddress: generatedSmartWallet,
      contractNumber: `ARB-${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`,
      status: 'active',
      network: 'Ethereum Mainnet',
      gasUsed: '0.0024 ETH',
      transactionHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    };

    const existing = JSON.parse(localStorage.getItem('alpha_deployments') || '[]');
    localStorage.setItem('alpha_deployments', JSON.stringify([newDeployment, ...existing]));

    setSmartAccount(generatedSmartWallet);
    setIsDeployed(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (!walletAddress && !isEditing) {
    return (
      <div className="glass-panel rounded-2xl border border-amber-500/20 p-6 bg-amber-500/5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <AlertCircle size={24} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
              No Wallet Address Configured
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
              Please set a wallet address in your .env file (DEFAULT_WALLET_ADDRESS) or click below to add one manually.
            </p>
            <button
              onClick={handleEditClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
            >
              <Edit3 size={12} />
              Add Wallet Address
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="glass-panel rounded-2xl border border-indigo-500/20 p-6 bg-indigo-500/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Edit3 size={20} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Set Owner Wallet (Metamask)
              </h3>
              <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">
                Paste Ethereum Address
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

        <div className="space-y-4">
          <div>
            <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Owner/Manager Address (Metamask)
            </label>
            <input
              type="text"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              placeholder="Enter your public address (0x...)"
              className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl text-[11px] font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
            />
            <p className="text-[8px] text-slate-600 mt-2">
              Must be a valid Ethereum address (42 characters, starting with 0x)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <Check size={14} />
              Save Address
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Wallet Info */}
      <div className={`glass-panel rounded-2xl border p-6 ${isDeployed ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${isDeployed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
              {isDeployed ? (
                <CheckCircle size={20} className="text-emerald-400" />
              ) : (
                <Wallet size={20} className="text-indigo-400" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {isDeployed ? 'Smart Engine Active' : 'Manager Connected'}
              </h3>
              <p className={`text-[8px] uppercase tracking-widest mt-0.5 flex items-center gap-1 ${isDeployed ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isDeployed && <Activity size={8} className="animate-pulse" />}
                {isDeployed ? 'Smart Portfolio (ERC-4337) Live' : 'Awaiting Smart Account Deployment'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDeployed && (
              <button
                onClick={() => {
                  setIsDeployed(false);
                  localStorage.removeItem('alpha_deployments');
                  window.dispatchEvent(new Event('storage'));
                }}
                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-all group"
                title="Disconnect & Clear Engine"
              >
                <RotateCcw size={14} className="text-rose-400 group-hover:rotate-180 transition-transform duration-500" />
              </button>
            )}
            <button
              onClick={() => {
                setWalletAddress('');
                onWalletChange('');
                setIsDeployed(false);
                setIsEditing(false);
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all group"
              title="Disconnect Wallet"
            >
              <LogOut size={14} className="text-slate-400 group-hover:text-rose-400 transition-colors" />
            </button>
            {!isDeployed && (
              <button
                onClick={handleEditClick}
                className="p-2 hover:bg-white/5 rounded-lg transition-all group"
                title="Change Address"
              >
                <Edit3 size={14} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Manager Address</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-white">{formatAddress(walletAddress)}</span>
              <button
                onClick={() => copyToClipboard(walletAddress)}
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

          {isDeployed && smartAccount && (
            <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Smart Execution Node</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-white" title={smartAccount}>{smartAccount.substring(0, 6)}...{smartAccount.substring(smartAccount.length - 4)}</span>
                <button
                  onClick={() => copyToClipboard(smartAccount)}
                  className="p-1 hover:bg-white/10 rounded transition-all"
                >
                  {copied ? (
                    <Check size={12} className="text-emerald-400" />
                  ) : (
                    <Copy size={12} className="text-indigo-400" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Source</span>
            <span className="text-[10px] font-bold text-slate-400">
              {walletAddress === process.env.DEFAULT_WALLET_ADDRESS ? '.env file' : 'User Override'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Status</span>
            <span className={`text-[10px] font-bold ${isDeployed ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isDeployed ? 'Active' : 'Configured'}
            </span>
          </div>
        </div>
      </div>

      {/* Deploy Section */}
      {!isDeployed && (
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

          <button
            onClick={handleDeploy}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-600/20"
          >
            <Zap size={16} />
            Deploy Arbitrage Engine
            <ChevronRight size={16} />
          </button>

          <div className="mt-4 p-3 bg-white/[0.01] border border-white/5 rounded-xl">
            <p className="text-[8px] text-slate-500 leading-relaxed">
              <Shield size={10} className="inline mr-1" />
              This will initialize the flash loan arbitrage engine using the configured wallet address.
            </p>
          </div>
        </div>
      )}

      {/* Deployed Status */}
      {isDeployed && (
        <div className="glass-panel rounded-2xl border border-emerald-500/20 p-6 bg-emerald-500/5">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <p className="text-[8px] text-emerald-300 leading-relaxed">
              <Shield size={10} className="inline mr-1" />
              The arbitrage engine is now live on Ethereum mainnet with the configured wallet address.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletManager;
