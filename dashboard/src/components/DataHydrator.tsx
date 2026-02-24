import React, { useEffect, useCallback } from 'react';
import { alphaOrionAPI } from '../services/api';
import { useAlphaOrionStore } from '../hooks/useAlphaOrionStore';
import { useConfigStore } from '../hooks/useConfigStore';

const DataHydrator: React.FC = () => {
    const { apiUrl } = useConfigStore();
    const {
        setProfitData,
        setOpportunities,
        setSystemHealth,
        setPimlicoStatus,
        setWallets,
        setLoading,
        updateLastUpdate,
        refreshInterval
    } = useAlphaOrionStore();

    const hydrate = useCallback(async () => {
        try {
            const apiBase = apiUrl;

            // Fetch stats
            const statsResponse = await fetch(`${apiBase}/api/dashboard/stats`).catch(() => null);
            if (statsResponse?.ok) {
                const stats = await statsResponse.json();
                setProfitData({
                    totalPnL: stats.totalPnl,
                    dailyPnL: stats.hourlyYield * 24 || 0,
                    winRate: stats.winRate, // winRate is already 0-1 from backend
                    lastTradeTime: stats.lastPulse || new Date().toISOString()
                } as any);

                setSystemHealth({
                    status: stats.systemStatus === 'active' ? 'healthy' : 'warning',
                    mode: stats.profitMode === 'production' ? 'LIVE PRODUCTION' : 'SIGNAL MODE',
                    uptime: stats.uptime,
                    connections: stats.activeConnections || 0
                } as any);

                if (stats.pimlico) {
                    setPimlicoStatus(stats.pimlico);
                }
            }

            // Fetch opportunities
            const oppsResponse = await fetch(`${apiBase}/api/dashboard/opportunities`).catch(() => null);
            if (oppsResponse?.ok) {
                const opps = await oppsResponse.json();
                setOpportunities(opps.map((o: any) => ({
                    ...o,
                    status: 'pending'
                })));
            }

            // Fetch wallets
            const walletsResponse = await fetch(`${apiBase}/api/wallets`).catch(() => null);
            if (walletsResponse?.ok) {
                const wallets = await walletsResponse.json();
                setWallets(wallets);
            }

            updateLastUpdate();
        } catch (error) {
            console.error('Data Hydration Error:', error);
        }
    }, [setProfitData, setOpportunities, setSystemHealth, updateLastUpdate]);

    useEffect(() => {
        hydrate();
        const interval = setInterval(hydrate, refreshInterval * 1000);
        return () => clearInterval(interval);
    }, [hydrate, refreshInterval]);

    return null; // This component doesn't render anything
};

export default DataHydrator;
