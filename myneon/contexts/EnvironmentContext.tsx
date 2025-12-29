import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Environment } from '../types';
import { setGlobalEnvironment } from '../services/deploymentService';

interface EnvironmentContextType {
  currentEnvironment: Environment;
  setEnvironment: (env: Environment) => void;
  isProduction: boolean;
  isSimulation: boolean;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export const useEnvironment = () => {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
};

interface EnvironmentProviderProps {
  children: ReactNode;
}

export const EnvironmentProvider: React.FC<EnvironmentProviderProps> = ({ children }) => {
  // Default to SIMULATION for safety
  const [currentEnvironment, setCurrentEnvironment] = useState<Environment>(Environment.SIMULATION);

  const setEnvironment = (env: Environment) => {
    // Add safety confirmation for production mode
    if (env === Environment.PRODUCTION) {
      const confirmed = window.confirm(
        '⚠️ PRODUCTION MODE WARNING ⚠️\n\n' +
        'You are switching to PRODUCTION mode. This will:\n' +
        '• Use real blockchain transactions\n' +
        '• Execute live trading operations\n' +
        '• Consume real gas fees\n' +
        '• Access production API keys\n\n' +
        'Are you sure you want to proceed?'
      );
      if (!confirmed) return;
    }
    setCurrentEnvironment(env);
    setGlobalEnvironment(env); // Sync with services
  };

  const value: EnvironmentContextType = {
    currentEnvironment,
    setEnvironment,
    isProduction: currentEnvironment === Environment.PRODUCTION,
    isSimulation: currentEnvironment === Environment.SIMULATION,
  };

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
};