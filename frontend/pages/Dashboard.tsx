
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useMockData } from '../hooks/useMockData';
import { Microservice, Opportunity } from '../types';
import { DollarSign, Zap, Server, Activity } from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, change }: { title: string; value: string; icon: React.ElementType; change?: string }) => (
  <Card className="flex flex-col">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-gray-400">{title}</p>
      <Icon className="w-5 h-5 text-gray-500" />
    </div>
    <div className="mt-2">
      <p className="text-2xl font-semibold text-white">{value}</p>
      {change && <p className="text-xs text-green-400">{change}</p>}
    </div>
  </Card>
);

const Dashboard: React.FC = () => {
  const { services, opportunities, pnlData, totalPnl, totalTrades } = useMockData();

  const onlineServices = services.filter(s => s.status === 'online').length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total PnL" value={`$${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} change="+2.5% today" />
        <MetricCard title="Total Trades" value={totalTrades.toLocaleString()} icon={Activity} />
        <MetricCard title="Live Opportunities" value={opportunities.length.toString()} icon={Zap} />
        <MetricCard title="Services Online" value={`${onlineServices} / ${services.length}`} icon={Server} />
      </div>

      <Card title="Real-Time PnL">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pnlData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#263148" />
              <XAxis dataKey="time" stroke="#909AAF" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#909AAF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1A2233', border: '1px solid #263148', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#FFFFFF' }}
                formatter={(value) => [`$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'PnL']}
              />
              <Area type="monotone" dataKey="pnl" stroke="#3B82F6" fillOpacity={1} fill="url(#colorPnl)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Latest Opportunities">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {opportunities.slice(0, 7).map((opp: Opportunity) => (
              <div key={opp.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-700/50">
                <div>
                  <p className="font-medium text-white">{opp.assets.join('/')} on {opp.exchanges.join(' > ')}</p>
                  <p className="text-xs text-gray-400">Risk: {opp.riskLevel}</p>
                </div>
                <p className="font-semibold text-green-400">+${opp.potentialProfit.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Service Status">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {services.slice(0, 7).map((service: Microservice) => (
              <div key={service.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-700/50">
                <div>
                  <p className="font-medium text-white">{service.name}</p>
                  <p className="text-xs text-gray-500">{service.region}</p>
                </div>
                <Badge status={service.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
