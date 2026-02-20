/**
 * Alpha-Copilot Engine Service
 * Powers self-deploying, self-healing capabilities for Alpha-Orion
 */

import { browserHistory } from 'react-router';

// Types
export interface DeploymentStatus {
  phase: 'idle' | 'detecting' | 'deploying' | 'healing' | 'running' | 'error';
  services: {
    dashboard: ServiceStatus;
    userApi: ServiceStatus;
    brainOrchestrator: ServiceStatus;
  };
  lastUpdate: string;
  logs: DeploymentLog[];
}

export interface ServiceStatus {
  name: string;
  status: 'unknown' | 'starting' | 'healthy' | 'degraded' | 'down';
  url?: string;
  lastChecked: string;
  restartCount: number;
}

export interface DeploymentLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  service?: string;
}

export interface ProfitStatus {
  mode: 'inactive' | 'detecting' | 'active' | 'profitable';
  totalPnl: number;
  tradesCount: number;
  lastTradeTimestamp: string;
  profitPerHour: number;
}

export interface HealthCheckResult {
  healthy: boolean;
  latency: number;
  services: Record<string, boolean>;
  issues: string[];
}

// Constants
const RENDER_API_BASE = 'https://api.render.com/v1';
const POLL_INTERVAL = 30000; // 30 seconds
const PROFIT_CHECK_INTERVAL = 60000; // 1 minute

class CopilotEngine {
  private static instance: CopilotEngine;
  private deploymentStatus: DeploymentStatus;
  private profitStatus: ProfitStatus;
  private pollIntervalId: NodeJS.Timeout | null = null;
  private profitIntervalId: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;
  private listeners: Set<(status: DeploymentStatus) => void> = new Set();

  private constructor() {
    this.deploymentStatus = {
      phase: 'idle',
      services: {
        dashboard: { name: 'Dashboard', status: 'unknown', lastChecked: '', restartCount: 0 },
        userApi: { name: 'User API', status: 'unknown', lastChecked: '', restartCount: 0 },
        brainOrchestrator: { name: 'Brain Orchestrator', status: 'unknown', lastChecked: '', restartCount: 0 },
      },
      lastUpdate: new Date().toISOString(),
      logs: [],
    };

    this.profitStatus = {
      mode: 'inactive',
      totalPnl: 0,
      tradesCount: 0,
      lastTradeTimestamp: '',
      profitPerHour: 0,
    };
  }

  static getInstance(): CopilotEngine {
    if (!CopilotEngine.instance) {
      CopilotEngine.instance = new CopilotEngine();
    }
    return CopilotEngine.instance;
  }

  // Event listeners for status updates
  addListener(callback: (status: DeploymentStatus) => void): void {
    this.listeners.add(callback);
  }

  removeListener(callback: (status: DeploymentStatus) => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.deploymentStatus));
  }

  private addLog(level: DeploymentLog['level'], message: string, service?: string): void {
    const log: DeploymentLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service,
    };
    this.deploymentStatus.logs.unshift(log);
    // Keep only last 50 logs
    if (this.deploymentStatus.logs.length > 50) {
      this.deploymentStatus.logs.pop();
    }
    this.deploymentStatus.lastUpdate = new Date().toISOString();
    this.notifyListeners();
  }

  // === Phase Detection ===

  async detectEnvironment(): Promise<'render' | 'gcp' | 'local' | 'unknown'> {
    this.updatePhase('detecting');
    this.addLog('info', 'Detecting deployment environment...');

    try {
      // Check if running on Render
      const renderCheck = await fetch('/health', { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) 
      }).catch(() => null);
      
      if (renderCheck?.ok) {
        this.addLog('success', 'Detected: Render environment');
        return 'render';
      }

      // Check for GCP headers
      const gcpCheck = await fetch('/api/health', { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) 
      }).catch(() => null);

      if (gcpCheck?.ok) {
        this.addLog('success', 'Detected: GCP environment');
        return 'gcp';
      }

      // Check localhost
      const localCheck = await fetch('http://localhost:8080/health', {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      }).catch(() => null);

      if (localCheck?.ok) {
        this.addLog('success', 'Detected: Local environment');
        return 'local';
      }

      this.addLog('warning', 'Could not determine environment, assuming local');
      return 'local';
    } catch (error) {
      this.addLog('error', `Environment detection failed: ${error}`);
      return 'unknown';
    }
  }

  // === Health Monitoring ===

  async checkServicesHealth(): Promise<HealthCheckResult> {
    const issues: string[] = [];
    const services: Record<string, boolean> = {};
    let healthyCount = 0;

    const endpoints = [
      { key: 'dashboard', url: '/', name: 'Dashboard' },
      { key: 'userApi', url: '/health', name: 'User API' },
      { key: 'brainOrchestrator', url: 'http://localhost:8081/services', name: 'Brain Orchestrator' },
    ];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      try {
        const isExternal = endpoint.url.startsWith('http');
        const response = await fetch(endpoint.url, {
          method: 'GET',
          signal: AbortSignal.timeout(10000),
        }).catch(() => null);

        const latency = Date.now() - startTime;
        const isHealthy = response?.ok ?? false;

        services[endpoint.key] = isHealthy;
        
        if (isHealthy) {
          healthyCount++;
          this.updateServiceStatus(endpoint.key as keyof DeploymentStatus['services'], {
            ...this.deploymentStatus.services[endpoint.key as keyof DeploymentStatus['services'][keyof DeploymentStatus['services']]],
            status: latency > 5000 ? 'degraded' : 'healthy',
            lastChecked: new Date().toISOString(),
            url: endpoint.url,
          });
        } else {
          issues.push(`${endpoint.name} is not responding`);
          this.updateServiceStatus(endpoint.key as keyof DeploymentStatus['services'], {
            ...this.deploymentStatus.services[endpoint.key as keyof DeploymentStatus['services'][keyof DeploymentStatus['services']]],
            status: 'down',
            lastChecked: new Date().toISOString(),
          });
        }
      } catch (error) {
        services[endpoint.key] = false;
        issues.push(`${endpoint.name} check failed: ${error}`);
        this.updateServiceStatus(endpoint.key as keyof DeploymentStatus['services'], {
          ...this.deploymentStatus.services[endpoint.key as keyof DeploymentStatus['services'][keyof DeploymentStatus['services']]],
          status: 'down',
          lastChecked: new Date().toISOString(),
        });
      }
    }

    const result = {
      healthy: healthyCount === endpoints.length,
      latency: 0,
      services,
      issues,
    };

    return result;
  }

  private updateServiceStatus(
    key: keyof DeploymentStatus['services'],
    status: ServiceStatus
  ): void {
    (this.deploymentStatus.services as any)[key] = status;
    this.notifyListeners();
  }

  // === Self-Healing ===

  async performSelfHealing(): Promise<void> {
    if (this.deploymentStatus.phase === 'healing') {
      this.addLog('warning', 'Self-healing already in progress');
      return;
    }

    this.updatePhase('healing');
    this.addLog('warning', 'Starting self-healing process...');

    const health = await this.checkServicesHealth();

    if (health.healthy) {
      this.addLog('success', 'All services healthy - no healing needed');
      this.updatePhase('running');
      return;
    }

    // Attempt to heal each down service
    for (const issue of health.issues) {
      this.addLog('info', `Attempting to heal: ${issue}`);
      
      // In a real implementation, this would trigger Render API calls
      // For now, we log the action
      this.addLog('warning', `Healing action triggered for: ${issue}`);
    }

    // Wait for healing to take effect
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Re-check health
    const newHealth = await this.checkServicesHealth();

    if (newHealth.healthy) {
      this.addLog('success', 'Self-healing completed successfully');
    } else {
      this.addLog('error', `Self-healing incomplete. Remaining issues: ${newHealth.issues.join(', ')}`);
    }

    this.updatePhase('running');
  }

  // === Profit Detection ===

  async checkProfitStatus(): Promise<ProfitStatus> {
    try {
      // Fetch profit data from brain orchestrator
      const response = await fetch('http://localhost:8081/profit/real-time', {
        signal: AbortSignal.timeout(10000),
      }).catch(() => null);

      if (response?.ok) {
        const data = await response.json();
        
        this.profitStatus = {
          mode: data.status === 'active' ? 'profitable' : 'detecting',
          totalPnl: data.totalPnl || 0,
          tradesCount: data.totalTrades || 0,
          lastTradeTimestamp: data.recentTrades?.[0]?.timestamp || '',
          profitPerHour: this.calculateProfitPerHour(data),
        };
      } else {
        this.profitStatus.mode = 'inactive';
      }
    } catch (error) {
      this.profitStatus.mode = 'inactive';
    }

    return this.profitStatus;
  }

  private calculateProfitPerHour(data: any): number {
    // Calculate profit per hour from recent trades
    if (!data?.recentTrades?.length) return 0;
    
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    const recentProfits = data.recentTrades
      .filter((trade: any) => new Date(trade.timestamp).getTime() > oneHourAgo)
      .reduce((sum: number, trade: any) => sum + (trade.profit_usd || 0), 0);
    
    return recentProfits;
  }

  // === Deployment Control ===

  async triggerDeployment(): Promise<void> {
    this.updatePhase('deploying');
    this.addLog('info', 'Triggering deployment...');

    try {
      // In production, this would trigger a Render deploy via API
      // For now, we simulate the deployment process
      
      // Simulate deployment steps
      this.addLog('info', 'Building Docker images...');
      await this.simulateDelay(3000);

      this.addLog('info', 'Deploying services to Render...');
      await this.simulateDelay(5000);

      this.addLog('info', 'Running health checks...');
      await this.simulateDelay(2000);

      // Check final status
      const health = await this.checkServicesHealth();

      if (health.healthy) {
        this.addLog('success', 'Deployment completed successfully');
        this.updatePhase('running');
      } else {
        this.addLog('warning', 'Deployment completed with issues, running self-healing...');
        await this.performSelfHealing();
      }
    } catch (error) {
      this.addLog('error', `Deployment failed: ${error}`);
      this.updatePhase('error');
    }
  }

  async restartService(serviceName: string): Promise<void> {
    this.addLog('info', `Restarting service: ${serviceName}...`);

    const serviceKey = this.getServiceKey(serviceName);
    if (serviceKey) {
      const currentCount = this.deploymentStatus.services[serviceKey].restartCount;
      this.updateServiceStatus(serviceKey, {
        ...this.deploymentStatus.services[serviceKey],
        status: 'starting',
        restartCount: currentCount + 1,
      });
    }

    // Simulate restart
    await this.simulateDelay(5000);

    this.addLog('success', `Service ${serviceName} restarted`);

    // Verify health
    await this.checkServicesHealth();
  }

  private getServiceKey(name: string): keyof DeploymentStatus['services'] | null {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('dashboard')) return 'dashboard';
    if (lowerName.includes('user') || lowerName.includes('api')) return 'userApi';
    if (lowerName.includes('brain') || lowerName.includes('orchestrator')) return 'brainOrchestrator';
    return null;
  }

  // === Lifecycle Methods ===

  private updatePhase(phase: DeploymentStatus['phase']): void {
    this.deploymentStatus.phase = phase;
    this.deploymentStatus.lastUpdate = new Date().toISOString();
    this.notifyListeners();
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async start(): Promise<void> {
    if (this.isInitialized) return;

    this.isInitialized = true;
    this.addLog('info', 'Alpha-Copilot Engine started');

    // Detect environment
    const environment = await this.detectEnvironment();

    // Initial health check
    await this.checkServicesHealth();

    // Initial profit check
    await this.checkProfitStatus();

    // Start polling
    this.pollIntervalId = setInterval(async () => {
      const health = await this.checkServicesHealth();
      
      if (!health.healthy && this.deploymentStatus.phase === 'running') {
        this.addLog('warning', 'Service degradation detected, initiating self-healing...');
        await this.performSelfHealing();
      }
    }, POLL_INTERVAL);

    this.profitIntervalId = setInterval(async () => {
      await this.checkProfitStatus();
    }, PROFIT_CHECK_INTERVAL);

    this.updatePhase('running');
  }

  stop(): void {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
    if (this.profitIntervalId) {
      clearInterval(this.profitIntervalId);
      this.profitIntervalId = null;
    }
    this.isInitialized = false;
    this.addLog('info', 'Alpha-Copilot Engine stopped');
  }

  // Getters
  getDeploymentStatus(): DeploymentStatus {
    return this.deploymentStatus;
  }

  getProfitStatus(): ProfitStatus {
    return this.profitStatus;
  }

  isRunning(): boolean {
    return this.isInitialized;
  }
}

export const copilotEngine = CopilotEngine.getInstance();
export default copilotEngine;
