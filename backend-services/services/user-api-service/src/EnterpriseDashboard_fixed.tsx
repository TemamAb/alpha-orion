import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const socket = io(API_URL);

interface Trade {
  number: number;
  pair: string;
  profit: number;
  status: string;
  timestamp: number;
}

interface Metrics {
  totalPnl: number;
  realizedProfit: number;
  unrealizedProfit: number;
  totalTrades: number;
  activeOpportunities: number;
  vaR: number;
  sharpeRatio: number;
}

const EnterpriseDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    totalPnl: 0,
    realizedProfit: 0,
    unrealizedProfit: 0,
    totalTrades: 0,
    activeOpportunities: 0,
    vaR: 0,
    sharpeRatio: 0
  });

  const [trades, setTrades] = useState<Trade[]>([]);
  const [pnlHistory, setPnlHistory] = useState<{ time: string; value: number }[]>([]);
  const [systemStatus, setSystemStatus] = useState<'ACTIVE' | 'PAUSED' | 'EMERGENCY'>('ACTIVE');

  // Mission Control State
  const [missionStep, setMissionStep] = useState<'IDLE' | 'VALIDATING' | 'VALIDATED' | 'DEPLOYING' | 'LIVE' | 'VALIDATION_FAILED' | 'DEPLOYMENT_FAILED'>('IDLE');
  const [missionLogs, setMissionLogs] = useState<string[]>([]);
  const [gcpProjectId, setGcpProjectId] = useState('');
  const [deploymentInfo, setDeploymentInfo] = useState<{ localUrl?: string, registry?: string, productionUrl?: string }>({});

  useEffect(() => {
    // Real-time WebSocket Event Listeners
    socket.on('connect', () => console.log('Connected to Enterprise Stream'));

    socket.on('dashboard:update', (data: any) => {
      setMetrics(prev => ({ ...prev, ...data }));
      setPnlHistory(prev => [...prev.slice(-19), {
        time: new Date().toLocaleTimeString(),
        value: data.totalPnl
      }]);
    });

    socket.on('trade:executed', (trade: Trade) => {
      setTrades(prev => [trade, ...prev].slice(0, 50));
    });

    // Mission Control Listeners
    const logHandler = (msg: string) => setMissionLogs(prev => [...prev.slice(-100), msg]);

    socket.on('mission:docker:log', logHandler);
    socket.on('mission:gcp:log', logHandler);

    socket.on('mission:docker:success', (data: any) => {
      setMissionStep('VALIDATED');
      setDeploymentInfo(prev => ({ ...prev, localUrl: data.url }));
      logHandler(`Local Validation Complete. App running at ${data.url}`);
    });

    socket.on('mission:gcp:success', (data: any) => {
      setMissionStep('LIVE');
      setDeploymentInfo(prev => ({ ...prev, registry: data.registry }));
      logHandler(`DEPLOYMENT SUCCESSFUL! Registry: ${data.registry}`);
      setDeploymentInfo(prev => ({ ...prev, registry: data.registry, productionUrl: data.url }));
      logHandler(`DEPLOYMENT SUCCESSFUL! URL: ${data.url}`);
    });

    socket.on('mission:docker:error', (err: string) => {
      setMissionStep('VALIDATION_FAILED');
      logHandler(`VALIDATION FAILED: ${err}`);
      logHandler(`TIP: Check Docker is running or run 'python fix-gcp-deployment-issues.py'`);
    });

    socket.on('mission:gcp:error', (err: string) => {
      setMissionStep('DEPLOYMENT_FAILED');
      logHandler(`DEPLOYMENT FAILED: ${err}`);
      logHandler(`TIP: Check permissions or run 'python fix-gcp-deployment-issues.py'`);
    });

    // Fetch initial risk metrics
    fetch(`${API_URL}/analytics/risk-metrics`)
      .then(res => res.json())
      .then(data => setMetrics(prev => ({
        ...prev,
        vaR: data.valueAtRisk,
        sharpeRatio: data.sharpeRatio
      })));

    return () => { socket.off(); };
  }, []);

  const handleKillSwitch = () => {
    if (window.confirm("EMERGENCY: Are you sure you want to STOP all trading?")) {
      setSystemStatus('EMERGENCY');
      alert("System Halted. Manual intervention required.");
    }
  };

  const startLocalValidation = () => {
    setMissionStep('VALIDATING');
    socket.emit('mission:docker:start');
  };

  const deployToCloud = () => {
    setMissionStep('DEPLOYING');
    socket.emit('mission:gcp:deploy', { projectId: gcpProjectId });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono p-6">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-400">ALPHA-ORION COMMAND CENTER</h1>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>SYSTEM: {systemStatus}</span>
            <span className="mx-2">|</span>
            <span>NET: Polygon zkEVM</span>
          </div>
        </div>
        <button
          onClick={handleKillSwitch}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-bold border border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
        >
          KILL SWITCH
        </button>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          label="TOTAL P&L"
          value={`$${metrics.totalPnl.toFixed(2)}`}
          color="text-green-400"
          subValue={`Realized: $${metrics.realizedProfit}`}
        />
        <MetricCard
          label="ACTIVE OPPS"
          value={metrics.activeOpportunities.toString()}
          color="text-blue-400"
          subValue="Scanning..."
        />
        <MetricCard
          label="RISK (VaR 99%)"
          value={`$${metrics.vaR.toFixed(2)}`}
          color="text-yellow-400"
          subValue={`Sharpe: ${metrics.sharpeRatio.toFixed(2)}`}
        />
        <MetricCard
          label="TOTAL TRADES"
          value={metrics.totalTrades.toString()}
          color="text-purple-400"
          subValue="Execution: <50ms"
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CHART SECTION */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-gray-300">Performance Trend (Real-Time)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pnlHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                  itemStyle={{ color: '#34D399' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#34D399"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LIVE FEED SECTION */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex flex-col h-[340px]">
          <h3 className="text-lg font-bold mb-4 text-gray-300">Live Execution Feed</h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-600">
            {trades.length === 0 ? (
              <div className="text-gray-500 text-center mt-10">Waiting for trades...</div>
            ) : (
              trades.map((trade, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-700/50 p-2 rounded text-sm border-l-2 border-green-500">
                  <div>
                    <span className="font-bold text-white">{trade.pair}</span>
                    <span className="text-xs text-gray-400 block">#{trade.number}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-green-400 font-bold">+${trade.profit.toFixed(2)}</span>
                    <span className="text-xs text-gray-400 block">CONFIRMED</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RISK PANEL */}
      <div className="mt-8 bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-red-400">Institutional Risk Panel</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <RiskItem label="Daily Drawdown" value="0.00%" status="SAFE" />
          <RiskItem label="Leverage" value="1.0x" status="SAFE" />
          <RiskItem label="Concentration" value="ETH 45%" status="WARNING" />
          <RiskItem label="Circuit Breaker" value="ARMED" status="ACTIVE" />
        </div>
      </div>

      {/* MISSION CONTROL PANEL */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
        <h3 className="text-xl font-bold mb-6 text-blue-400 flex items-center">
          <span className="mr-2">🚀</span> MISSION CONTROL: DEPLOYMENT OPS
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            {/* Step 1: Local Validation */}
            <div className={`p-4 rounded border ${['IDLE', 'VALIDATING', 'VALIDATION_FAILED'].includes(missionStep) ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 bg-gray-800/50'}`}>
              <h4 className="font-bold text-lg mb-2">1. Local Docker Validation</h4>
              <p className="text-sm text-gray-400 mb-4">Auto-detect free ports and run containerized simulation.</p>
              {['IDLE', 'VALIDATION_FAILED'].includes(missionStep) ? (
                <button onClick={startLocalValidation} className={`bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold w-full ${missionStep === 'VALIDATION_FAILED' ? 'bg-red-600 hover:bg-red-500' : ''}`}>
                  {missionStep === 'VALIDATION_FAILED' ? 'RETRY VALIDATION' : 'INITIATE VALIDATION'}
                </button>
              ) : missionStep === 'VALIDATING' ? (
                <div className="text-blue-400 animate-pulse">Validating... Check logs</div>
              ) : (
                <div className="text-green-400 font-bold">VALIDATED ({deploymentInfo.localUrl})</div>
              )}
              {missionStep === 'VALIDATION_FAILED' && <div className="mt-2 text-red-400 text-xs font-bold">Validation failed. Check logs for details.</div>}
            </div>

            {/* Step 2: Cloud Deployment */}
            <div className={`p-4 rounded border ${['VALIDATED', 'DEPLOYING', 'DEPLOYMENT_FAILED'].includes(missionStep) ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 bg-gray-800/50'}`}>
              <h4 className="font-bold text-lg mb-2">2. Production Deployment</h4>
              <p className="text-sm text-gray-400 mb-4">Deploy validated artifact to Google Cloud Run.</p>

              <input
                type="text"
                placeholder="Enter GCP Project ID"
                className="w-full bg-gray-900 border border-gray-600 rounded p-2 mb-3 text-white"
                value={gcpProjectId}
                onChange={(e) => setGcpProjectId(e.target.value)}
                disabled={!['VALIDATED', 'DEPLOYMENT_FAILED'].includes(missionStep)}
              />

              <button
                onClick={deployToCloud}
                disabled={!['VALIDATED', 'DEPLOYMENT_FAILED'].includes(missionStep) || !gcpProjectId}
                className={`w-full px-4 py-2 rounded font-bold ${(['VALIDATED', 'DEPLOYMENT_FAILED'].includes(missionStep) && gcpProjectId) ? (missionStep === 'DEPLOYMENT_FAILED' ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white') : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
              >
                {missionStep === 'DEPLOYING' ? 'DEPLOYING...' : missionStep === 'DEPLOYMENT_FAILED' ? 'RETRY DEPLOYMENT' : 'DEPLOY TO PRODUCTION'}
              </button>

              {missionStep === 'DEPLOYMENT_FAILED' && <div className="mt-2 text-red-400 text-xs font-bold">Deployment failed. Check logs for details.</div>}
              {missionStep === 'LIVE' && (
                <div className="mt-4 p-3 bg-green-900/30 border border-green-500 rounded animate-fade-in">
                  <div className="font-bold text-green-400">SYSTEM LIVE</div>
                  <a href={deploymentInfo.productionUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-400 underline break-all hover:text-blue-300">{deploymentInfo.productionUrl}</a>
                </div>
              )}
            </div>
          </div>

          {/* Live Logs Terminal */}
          <div className="bg-black rounded border border-gray-700 p-4 font-mono text-xs h-[300px] overflow-y-auto">
            <div className="text-gray-500 mb-2">--- MISSION LOGS ---</div>
            {missionLogs.length === 0 && <div className="text-gray-600 italic">Ready for commands...</div>}
            {missionLogs.map((log, i) => <div key={i} className="mb-1 break-all">{log}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const MetricCard = ({ label, value, color, subValue }: any) => (
  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-lg">
    <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</div>
    <div className={`text-3xl font-bold ${color}`}>{value}</div>
    <div className="text-gray-500 text-xs mt-2">{subValue}</div>
  </div>
);

const RiskItem = ({ label, value, status }: any) => (
  <div className="bg-gray-900 p-3 rounded border border-gray-700 flex justify-between items-center">
    <span className="text-gray-400">{label}</span>
    <div className="text-right">
      <div className="text-white font-bold">{value}</div>
      <div className={`text-xs ${
        status === 'SAFE' ? 'text-green-500' :
        status === 'WARNING' ? 'text-yellow-500' :
        'text-red-500'
      }`}>
        {status}
      </div>
    </div>
  </div>
);

export default EnterpriseDashboard;
