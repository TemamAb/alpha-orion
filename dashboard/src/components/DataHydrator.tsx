import React, { useEffect, useCallback, useState } from 'react';
import { alphaOrionAPI } from '../services/api';
import { useAlphaOrionStore } from '../hooks/useAlphaOrionStore';
import { useConfigStore } from '../hooks/useConfigStore';

/**
 * Safely parse JSON from a fetch Response.
 * Returns null if the response is HTML (SPA catch-all), not JSON, or fails.
 */
async function safeJson(response: Response): Promise<any | null> {
    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
        // The server returned HTML (static-server SPA catch-all) — backend not ready yet
        return null;
    }
    try {
        return await response.json();
    } catch {
        return null;
    }
}

const DataHydrator: React.FC = () => {
    const { apiUrl } = useConfigStore();
    const [backendReady, setBackendReady] = useState<boolean | null>(null); // null = unknown
    const {
        setProfitData,
        setOpportunities,
        setSystemHealth,
        setPimlicoStatus,
        setWallets,
        setEngineRunning,
        fetchEngineStatus,
        updateLastUpdate,
        refreshInterval
    } = useAlphaOrionStore();

    const hydrate = useCallback(async () => {
        const apiBase = apiUrl;

        try {
            // ── Stats ──────────────────────────────────────────────
            const statsResponse = await fetch(`${apiBase}/api/dashboard/stats`).catch(() => null);

            if (statsResponse?.ok) {
                const stats = await safeJson(statsResponse);

                if (stats) {
                    // ✅ Real JSON from the Node.js backend
                    setBackendReady(true);

                    setProfitData({
                        totalPnL: stats.totalPnl || 0,
                        dailyPnL: (stats.hourlyYield || 0) * 24,
                        winRate: stats.winRate || 0,
                        lastTradeTime: stats.lastPulse || new Date().toISOString()
                    } as any);

                    setSystemHealth({
                        status: stats.systemStatus === 'active' ? 'healthy' : 'warning',
                        mode: stats.profitMode === 'production' ? 'LIVE PRODUCTION' : 'SIGNAL MODE',
                        uptime: stats.uptime || 0,
                        connections: stats.activeConnections || 0
                    } as any);

                    setEngineRunning(stats.systemStatus === 'active');

                    if (stats.pimlico) {
                        setPimlicoStatus(stats.pimlico);
                    }
                } else {
                    // Got 200 but HTML — static server is still the start command (needs update)
                    setBackendReady(false);
                }
            } else {
                // Non-200 or network failure
                setBackendReady(false);
            }

            // ── Opportunities ─────────────────────────────────────
            const oppsResponse = await fetch(`${apiBase}/api/dashboard/opportunities`).catch(() => null);
            if (oppsResponse?.ok) {
                const opps = await safeJson(oppsResponse);
                if (Array.isArray(opps)) {
                    setOpportunities(opps.map((o: any) => ({ ...o, status: 'pending' })));
                }
            }

            // ── Wallets ───────────────────────────────────────────
            const walletsResponse = await fetch(`${apiBase}/api/wallets`).catch(() => null);
            if (walletsResponse?.ok) {
                const wallets = await safeJson(walletsResponse);
                if (Array.isArray(wallets)) setWallets(wallets);
            }

            // ── Engine status (standalone poll) ───────────────────
            await fetchEngineStatus();
            updateLastUpdate();

        } catch (err) {
            console.error('[DataHydrator] Unexpected error:', err);
            setBackendReady(false);
        }
    }, [setProfitData, setOpportunities, setSystemHealth, setPimlicoStatus, setWallets,
        setEngineRunning, fetchEngineStatus, updateLastUpdate, apiUrl]);

    useEffect(() => {
        hydrate();
        const interval = setInterval(hydrate, refreshInterval * 1000);
        return () => clearInterval(interval);
    }, [hydrate, refreshInterval]);

    // ── Backend not ready banner (replaces the ugly JSON error) ──
    if (backendReady === false) {
        return (
            <div className="fixed top-4 right-4 z-50 max-w-sm">
                <div className="bg-amber-900/80 border border-amber-500/60 text-white px-4 py-3 rounded-xl shadow-xl flex items-start gap-3 backdrop-blur">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-xs font-black text-amber-300 uppercase tracking-widest">Backend Deploying</p>
                        <p className="text-[10px] text-amber-200/70 mt-1 leading-relaxed">
                            API service is starting up. Signal scanning will begin automatically once the backend is ready.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default DataHydrator;
