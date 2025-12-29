
import { ModulePerformance, ModuleInfo } from "../types";

export const captureActivePerformance = async (modules: ModuleInfo[], isStress: boolean = false): Promise<ModulePerformance[]> => {
  // Specifically monitoring Core Engine and Data Aggregator
  const targets = modules.filter(m => 
    m.id === 'core-engine-layer' || m.id === 'data-aggregator' || m.id === 'mempool-scanner'
  );

  const jitterBase = isStress ? 5000 : 800;
  const lossBase = isStress ? 0.05 : 0.0001;

  return targets.map(m => {
    const isAggregator = m.id === 'data-aggregator';
    return {
      moduleId: m.id,
      moduleName: m.name,
      latencyNs: isAggregator ? (400000 + Math.random() * 200000) : (150000 + (Math.random() * 500000)),
      throughputTps: isAggregator ? (15000 + Math.random() * 10000) : (1200 + (Math.random() * 8000)),
      resourceLoad: isStress ? (75 + Math.random() * 20) : (12 + (Math.random() * 45)),
      peakJitterNs: jitterBase + (Math.random() * 2000),
      packetLossRate: lossBase + (Math.random() * 0.02)
    };
  });
};
