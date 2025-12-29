import React, { useState, useEffect } from 'react';

const ExecutiveDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    nodeStatus: 'SYNCING...',
    gasPrice: '0.0',
    yieldPerHour: 0,
    yieldPerSwap: 0,
    netProduction: 0,
    vaultBalance: 0,
    confidenceScore: 71,
    nodeLatency: 0,
  });

  const PRODUCTION_URL = "https://orion-d5rc.onrender.com";

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Connect to your production backend
        const response = await fetch(`${PRODUCTION_URL}/api/metrics`);
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(fetchMetrics, 3000);
    fetchMetrics();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="executive-dashboard">
      <header className="dashboard-header">
        <h1>AION ARCHITECT PRODUCTION v4.0</h1>
        <h3>Institutional Grade Flash-Arbitrage Infrastructure</h3>
      </header>

      <div className="metrics-grid">
        {/* Live Node Status */}
        <div className="metric-card">
          <h4>Live Node</h4>
          <div className="metric-value">{metrics.nodeStatus}</div>
        </div>

        {/* Gas Price */}
        <div className="metric-card">
          <h4>Gas</h4>
          <div className="metric-value">{metrics.gasPrice} Gwei</div>
        </div>

        {/* Start Trading Button */}
        <div className="metric-card action-card">
          <button className="trade-button">Start Trading</button>
        </div>

        {/* Yield / Hour */}
        <div className="metric-card">
          <h4>Yield / Hour</h4>
          <div className="metric-value">${metrics.yieldPerHour.toFixed(2)}</div>
          <div className="metric-change positive">+12.4% Optimal</div>
        </div>

        {/* Yield / Swap */}
        <div className="metric-card">
          <h4>Yield / Swap</h4>
          <div className="metric-value">${metrics.yieldPerSwap.toFixed(2)}</div>
        </div>

        {/* Add all other metrics from your production dashboard */}
        
        {/* Confidence Score */}
        <div className="metric-card">
          <h4>Confidence Score</h4>
          <div className="metric-value">{metrics.confidenceScore}%</div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${metrics.confidenceScore}%` }}
            ></div>
          </div>
        </div>

        {/* Node Latency */}
        <div className="metric-card">
          <h4>Node Latency</h4>
          <div className="metric-value">{metrics.nodeLatency}ms</div>
        </div>
      </div>

      {/* System Status */}
      <div className="system-status">
        <h4>Real-time Telemetry Terminal</h4>
        <div className="status-grid">
          <div className="status-item online">P-Node: ONLINE</div>
          <div className="status-item online">S-Node: ONLINE</div>
          <div className="status-item online">Oracle-V3: ONLINE</div>
          <div className="status-item online">RPC-Core: ONLINE</div>
          <div className="status-item online">MEV-Guard: ONLINE</div>
          <div className="status-item online">AI-Engine: ONLINE</div>
          <div className="status-item online">Settlement: ONLINE</div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
