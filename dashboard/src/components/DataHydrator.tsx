import React, { useEffect, useCallback, useState } from 'react';
import { alphaOrionAPI } from '../services/api';
import { useAlphaOrionStore } from '../hooks/useAlphaOrionStore';
import { useConfigStore } from '../hooks/useConfigStore';

const DataHydrator: React.FC = () => {
    const { apiUrl } = useConfigStore();
    const [error, setError] = useState<string | null>(null);
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
        setError(null);
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
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setError(`Failed to connect to API: ${errorMessage}. Please check if the backend service is running.`);
        }
    }, [setProfitData, setOpportunities, setSystemHealth, setPimlicoStatus, setWallets, updateLastUpdate, apiUrl]);

    useEffect(() => {
        hydrate();
        const interval = setInterval(hydrate, refreshInterval * 1000);
        return () => clearInterval(interval);
    }, [hydrate, refreshInterval]);

    // Display error notification if there's an API error
    if (error) {
        return (
            <div className="fixed top-4 right-4 z-50 max-w-md">
                <div className="bg-red-900/80 border border-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                        <p className="text-sm font-medium">Connection Error</p>
                        <p className="text-xs text-red-200 mt-1">{error}</p>
                    </div>
                    <button 
                        onClick={() => setError(null)}
                        className="text-red-300 hover:text-white"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    return null; // This component doesn't render anything normally
};

export default DataHydrator;
