import { useState, useEffect } from 'react';
import { Microservice, Opportunity, Strategy, PnlChartData } from '../types';

const API_BASE = 'http://localhost:8080'; // Adjust for production

export const useApiData = () => {
  const [services, setServices] = useState<Microservice[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [pnlData, setPnlData] = useState<PnlChartData[]>([]);
  const [totalPnl, setTotalPnl] = useState<number>(0);
  const [totalTrades, setTotalTrades] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [servicesRes, opportunitiesRes, strategiesRes, pnlRes, totalRes] = await Promise.all([
          fetch(`${API_BASE}/services`),
          fetch(`${API_BASE}/opportunities`),
          fetch(`${API_BASE}/strategies`),
          fetch(`${API_BASE}/analytics/pnl`),
          fetch(`${API_BASE}/analytics/total-pnl`)
        ]);

        if (!servicesRes.ok || !opportunitiesRes.ok || !strategiesRes.ok || !pnlRes.ok || !totalRes.ok) {
          throw new Error('Failed to fetch data from one or more endpoints');
        }

        setServices(await servicesRes.json());
        setOpportunities(await opportunitiesRes.json());
        setStrategies(await strategiesRes.json());
        setPnlData(await pnlRes.json());
        const total = await totalRes.json();
        setTotalPnl(total.totalPnl);
        setTotalTrades(total.totalTrades);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Poll for updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return { services, opportunities, strategies, pnlData, totalPnl, totalTrades, loading, error };
};
