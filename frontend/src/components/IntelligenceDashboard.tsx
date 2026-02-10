
import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import { useGeminiAnalysis } from '../hooks/useGeminiAnalysis';
import { Activity, Cpu, Database, Zap, RefreshCw, Layers } from 'lucide-react';
import { Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const IntelligenceDashboard: React.FC = () => {
    const { analysis, loading, refreshAnalysis } = useGeminiAnalysis();
    const [optimizationCycle, setOptimizationCycle] = useState<'BUILD' | 'DEPLOY' | 'MONITOR' | 'OPTIMIZE'>('MONITOR');

    useEffect(() => {
        // Intelligence Cycle Tick
        const cycles = ['BUILD', 'DEPLOY', 'MONITOR', 'OPTIMIZE'] as const;
        let i = 0;
        const interval = setInterval(() => {
            setOptimizationCycle(cycles[i]);
            i = (i + 1) % 4;
        }, 5000); // 5-second cycle for visualization
        return () => clearInterval(interval);
    }, []);

    const CycleBadge = ({ stage }: { stage: string }) => {
        const isActive = optimizationCycle === stage;
        return (
            <div className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-300 ${isActive ? 'border-blue-500 bg-blue-900/40 scale-105' : 'border-gray-700 bg-gray-800 opacity-50'
                }`}>
                <span className={`text-xs font-bold ${isActive ? 'text-blue-400' : 'text-gray-500'}`}>{stage}</span>
                {isActive && <Activity className="w-4 h-4 text-blue-400 mt-1 animate-pulse" />}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Cpu className="text-purple-400" />
                    Gemini 1.5 Pro Intelligence Core
                </h1>
                <div className="flex gap-2">
                    <CycleBadge stage="BUILD" />
                    <CycleBadge stage="DEPLOY" />
                    <CycleBadge stage="MONITOR" />
                    <CycleBadge stage="OPTIMIZE" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Latest Reasonings (Chain of Thought)">
                    <div className="h-64 overflow-y-auto font-mono text-xs text-green-400 space-y-2 bg-black/50 p-4 rounded">
                        {analysis?.reasoning ? (
                            analysis.reasoning.map((step: string, i: number) => (
                                <div key={i} className="flex gap-2">
                                    <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>
                                    <span>{step}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 animate-pulse">
                                <Zap className="w-4 h-4 mr-2" />
                                Acquiring Satellite Telemetry...
                            </div>
                        )}
                    </div>
                </Card>

                <Card title="System Optimization Metrics">
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analysis?.metrics || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="metric" stroke="#666" fontSize={10} />
                                <YAxis stroke="#666" fontSize={10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', borderColor: '#333' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="value" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <div className="flex justify-between">
                        <h3 className="text-gray-400 text-sm">Active Contracts</h3>
                        <Database className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-white mt-1">V08-Elite</p>
                    <p className="text-xs text-green-400">Verifying Block 192837...</p>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <div className="flex justify-between">
                        <h3 className="text-gray-400 text-sm">AI Prediction Model</h3>
                        <Layers className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-white mt-1">Gemini-1.5-Pro</p>
                    <p className="text-xs text-purple-400">Latency: 142ms</p>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <div className="flex justify-between">
                        <h3 className="text-gray-400 text-sm">Self-Healing</h3>
                        <RefreshCw className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-white mt-1">Active</p>
                    <p className="text-xs text-gray-400">0 Incidents last hour</p>
                </Card>
            </div>
        </div>
    );
};

export default IntelligenceDashboard;
