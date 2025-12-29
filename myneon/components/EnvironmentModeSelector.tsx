import React from 'react';
import { Environment } from '../types';
import { useEnvironment } from '../contexts/EnvironmentContext';

const EnvironmentModeSelector: React.FC = () => {
  const { currentEnvironment, setEnvironment, isProduction, isSimulation } = useEnvironment();

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`px-4 py-2 rounded-lg border-2 font-bold text-sm transition-all duration-300 ${
        isProduction
          ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-lg shadow-red-500/20'
          : 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-500/20'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            isProduction ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
          }`} />
          <span className="uppercase tracking-wide">
            {isProduction ? '🔴 PRODUCTION' : '🔵 SIMULATION'}
          </span>
          <button
            onClick={() => setEnvironment(isProduction ? Environment.SIMULATION : Environment.PRODUCTION)}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              isProduction
                ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300'
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-300'
            }`}
          >
            Switch to {isProduction ? 'SIM' : 'PROD'}
          </button>
        </div>

        {isProduction && (
          <div className="mt-2 text-xs text-red-300/80 border-t border-red-500/30 pt-2">
            ⚠️ Live trading active - Real funds at risk
          </div>
        )}

        {isSimulation && (
          <div className="mt-2 text-xs text-blue-300/80 border-t border-blue-500/30 pt-2">
            🧪 Safe testing mode - No real transactions
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvironmentModeSelector;