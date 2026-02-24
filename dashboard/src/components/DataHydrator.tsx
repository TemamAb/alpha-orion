import React, { useEffect, useCallback } from 'react';
import { alphaOrionAPI } from '../services/api';
import { useAlphaOrionStore } from '../hooks/useAlphaOrionStore';

const DataHydrator: React.FC = () => {
    const {
        setProfitData,
        setOpportunities,
        setSystemHealth,
        setPimlicoStatus,
        setLoading,
        updateLastUpdate,
        refreshInterval
    } = useAlphaOrionStore();

    const hydrate = useCallback(async () => {
        try {
            // Fetch stats
            const statsResponse = await fetch('/api/dashboard/stats').catch(() => null);
            if (statsResponse?.ok) {
                const stats = await statsResponse.json();
                setProfitData({
                    totalPnL: stats.totalPnl,
                    dailyPnL: stats.hourlyYield * 24 || 0,
                    winRate: stats.winRate * 100, // Display as percentage
                    lastTradeTime: stats.lastPulse || new Date().toISOString()
                } as any);

                setSystemHealth({
                    status: stats.systemStatus === 'active' ? 'healthy' : 'warning',
                    mode: stats.profitMode === 'production' ? 'LIVE PRODUCTION' : 'SIGNAL MODE',
                    uptime: stats.uptime,
                    connections: stats.activeConnections || 0
                } as any);

                // If there are engine metrics, we could also store them
                if (stats.alphaVelocity) {
                    // Update additional metrics if needed
                }
            }

            // Fetch opportunities
            const oppsResponse = await fetch('/api/dashboard/opportunities').catch(() => null);
            if (oppsResponse?.ok) {
                const opps = await oppsResponse.json();
                setOpportunities(opps.map((o: any) => ({
                    ...o,
                    status: 'pending'
                })));
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
