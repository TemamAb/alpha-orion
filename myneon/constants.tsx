
import { CertLevel, ModuleInfo, SpecialistAgent, ModuleTier } from './types';

export const SPECIALIST_AGENTS: SpecialistAgent[] = [
  { 
    id: 'agent-kernel-brain', 
    name: 'Identity Orchestrator', 
    role: 'Sovereign Synthesis Specialist', 
    color: '#3b82f6', 
    icon: '🧬',
    specialty: 'Logic',
    responsibility: 'Synthesizes client identity layers into the AION core kernel while ensuring 100% logic parity with elite-grade execution benchmarks.',
    missionBacklog: [
      { task: 'Variant Identity Injection', status: 'verified' },
      { task: 'Kernel-to-Identity Mapping Audit', status: 'active' }
    ]
  },
  { 
    id: 'navigator', 
    name: 'The Arbiter', 
    role: 'Dominance Strategist', 
    color: '#a855f7', 
    icon: '⚖️',
    specialty: 'General',
    responsibility: 'Validates variant performance against the Global Trinity Average. Ensures the synthesized instance maintains AION’s sub-ns physics.',
    missionBacklog: [
      { task: 'Trinity Trace Benchmarking', status: 'active' },
      { task: 'Sovereign Finality Certification', status: 'pending' }
    ]
  }
];

export const CORE_MODULES: ModuleInfo[] = [
  {
    id: 'dominance-arbiter',
    name: '🏆 Sovereign Arbiter',
    dedicatedAgentId: 'navigator',
    purpose: 'Validates synthesized variant performance against industry leaders (Flashbots, Jito, BeaverBuild).',
    features: [
      'Trinity Dissection (L)', 
      'Sovereign Explainability (S)', 
      'Variant Alpha Tracking (O)', 
      'Trace Synchronization (T)',
      'Synthesis Verification (I)'
    ],
    certLevel: 'PLATINUM',
    tier: 'Tier-X: System',
    score: 100,
    status: 'certified',
    isIntegrated: true,
    adaptiveFeatures: { 
      comparativeLogic: true, 
      shadowSecurity: true, 
      elasticOptimization: true, 
      externalTelemetry: true, 
      synthesisIntelligence: true 
    }
  },
  {
    id: 'adaptive-kernel',
    name: '⚙️ Variant Execution Kernel',
    dedicatedAgentId: 'agent-kernel-brain',
    purpose: 'Core execution engine instantiated for specific identity projection. Beats Global Trinity Average.',
    features: [
      'Identity Injection (L)', 
      'Elastic Throughput (S)', 
      'Zero-Copy Synthesis (O)', 
      'Physics Telemetry (T)',
      'Neural Variant Synth (I)'
    ],
    certLevel: 'UNCERTIFIED',
    tier: 'Tier-X: System',
    score: 0,
    status: 'idle',
    isIntegrated: false,
    adaptiveFeatures: { 
      comparativeLogic: false, 
      shadowSecurity: false, 
      elasticOptimization: false, 
      externalTelemetry: false, 
      synthesisIntelligence: false 
    }
  }
];
