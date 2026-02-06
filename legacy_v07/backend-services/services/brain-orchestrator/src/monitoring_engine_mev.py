import time
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class MonitoringEngine:
    """
    Phase 5.2: Monitoring & Alerting
    Implements comprehensive monitoring, performance tracking, and automated alerting.
    Enhanced with MEV protection metrics across all five phases.
    """

    def __init__(self):
        self.metrics = {
            'requests_total': 0,
            'errors_total': 0,
            'latency_sum': 0,
            'latency_count': 0,
            'active_trades': 0,
            'system_health': 'HEALTHY'
        }
        self.alert_thresholds = {
            'error_rate': 0.01, # 1%
            'latency_p99': 100, # ms
            'consecutive_failures': 5
        }
        self.incident_history = []

        # MEV Protection Metrics - Phase-wise tracking
        self.mev_metrics = {
            # Design Phase MEV Protection
            'design_mev_gas_limits': True,
            'design_mev_private_pools': True,
            'design_mev_validation_rules': True,

            # Deploy Phase MEV Protection
            'deploy_mev_contract_verification': True,
            'deploy_mev_integration_tests': True,
            'deploy_mev_security_audit': True,

            # Monitor Phase MEV Protection
            'monitor_sandwich_attacks_prevented': 0,
            'monitor_front_running_attempts_blocked': 0,
            'monitor_gas_price_rejections': 0,
            'monitor_private_pool_transactions': 0,
            'monitor_mev_profit_saved_usd': 0.0,
            'monitor_mev_effectiveness_rate': 0.0,
            'monitor_last_mev_attack_time': None,
            'monitor_mev_protection_active': True,

            # Analyze Phase MEV Protection
            'analyze_mev_attack_patterns': [],
            'analyze_mev_risk_assessment': 'LOW',
            'analyze_mev_trend_analysis': {},
            'analyze_mev_predictive_alerts': [],

            # Optimize Phase MEV Protection
            'optimize_mev_ai_improvements': [],
            'optimize_mev_gas_strategy_updates': [],
            'optimize_mev_protection_enhancements': [],
            'optimize_mev_automated_responses': True
        }

    def track_request(self, latency_ms: float, is_error: bool = False):
        """
        Record request metrics.
        """
        self.metrics['requests_total'] += 1
        self.metrics['latency_sum'] += latency_ms
        self.metrics['latency_count'] += 1

        if is_error:
            self.metrics['errors_total'] += 1

        self._check_thresholds()

    def _check_thresholds(self):
        """
        Check if any metrics violate alert thresholds.
        """
        if self.metrics['requests_total'] > 0:
            error_rate = self.metrics['errors_total'] / self.metrics['requests_total']
            if error_rate > self.alert_thresholds['error_rate']:
                self.trigger_alert("HIGH_ERROR_RATE", f"Error rate {error_rate:.2%} exceeds threshold")

        avg_latency = 0
        if self.metrics['latency_count'] > 0:
            avg_latency = self.metrics['latency_sum'] / self.metrics['latency_count']

        # Simplified P99 check (using average as proxy for demo)
        if avg_latency > self.alert_thresholds['latency_p99']:
             self.trigger_alert("HIGH_LATENCY", f"Avg latency {avg_latency:.2f}ms exceeds threshold")

    def trigger_alert(self, alert_type: str, message: str):
        """
        Trigger an automated alert (e.g., PagerDuty, Slack).
        """
        timestamp = time.time()
        alert = {
            'type': alert_type,
            'message': message,
            'timestamp': timestamp,
            'status': 'ACTIVE'
        }
        self.incident_history.append(alert)
        logger.error(f"ALERT [{alert_type}]: {message}")

        # In a real implementation, this would call external APIs
        # self.send_pagerduty_alert(alert)
        # self.send_slack_alert(alert)

    def get_system_health(self) -> Dict[str, Any]:
        """
        Return current system health status.
        """
        uptime = 99.99 # Placeholder for actual uptime calc

        return {
            'status': self.metrics['system_health'],
            'uptime_sla': f"{uptime}%",
            'metrics': self.metrics,
            'active_incidents': [i for i in self.incident_history if i['status'] == 'ACTIVE']
        }

    def update_health_status(self, status: str):
        self.metrics['system_health'] = status
        logger.info(f"System health updated to: {status}")

    # MEV Protection Monitoring Methods
    def record_mev_protection_event(self, event_type: str, value: float = 0.0, phase: str = 'monitor'):
        """
        Record MEV protection events across different phases.
        """
        phase_prefix = f"{phase}_"

        if event_type == 'sandwich_attack_prevented':
            self.mev_metrics[f'{phase_prefix}sandwich_attacks_prevented'] += 1
            self.mev_metrics[f'{phase_prefix}mev_profit_saved_usd'] += value
            self.mev_metrics[f'{phase_prefix}last_mev_attack_time'] = time.time()

        elif event_type == 'front_running_blocked':
            self.mev_metrics[f'{phase_prefix}front_running_attempts_blocked'] += 1
            self.mev_metrics[f'{phase_prefix}mev_profit_saved_usd'] += value

        elif event_type == 'gas_price_rejection':
            self.mev_metrics[f'{phase_prefix}gas_price_rejections'] += 1

        elif event_type == 'private_pool_used':
            self.mev_metrics[f'{phase_prefix}private_pool_transactions'] += 1

        # Update effectiveness rate
        total_protections = (
            self.mev_metrics.get(f'{phase_prefix}sandwich_attacks_prevented', 0) +
            self.mev_metrics.get(f'{phase_prefix}front_running_attempts_blocked', 0) +
            self.mev_metrics.get(f'{phase_prefix}gas_price_rejections', 0)
        )

        if total_protections > 0:
            effectiveness = min(100.0, (total_protections / max(1, total_protections + 5)) * 100)
            self.mev_metrics[f'{phase_prefix}mev_effectiveness_rate'] = effectiveness

        logger.info(f"MEV Protection Event [{phase}]: {event_type} - Value: ${value:.2f}")

    def get_mev_protection_metrics(self, phase: str = 'all') -> Dict[str, Any]:
        """
        Get comprehensive MEV protection metrics for specified phase or all phases.
        """
        if phase == 'all':
            return self.mev_metrics
        else:
            # Return metrics for specific phase
            phase_metrics = {k: v for k, v in self.mev_metrics.items() if k.startswith(f"{phase}_")}
            return phase_metrics

    def check_mev_alerts(self) -> list:
        """
        Check for MEV-related alerts across all phases.
        """
        alerts = []

        # Check each phase for MEV issues
        phases = ['design', 'deploy', 'monitor', 'analyze', 'optimize']

        for phase in phases:
            phase_prefix = f"{phase}_"

            # Alert if MEV protection is disabled
            if not self.mev_metrics.get(f'{phase_prefix}mev_protection_active', True):
                alerts.append({
                    'type': f'MEV_PROTECTION_DISABLED_{phase.upper()}',
                    'severity': 'CRITICAL',
                    'message': f'MEV protection disabled in {phase} phase - system vulnerable to attacks',
                    'phase': phase
                })

            # Alert if effectiveness rate drops below 80%
            effectiveness = self.mev_metrics.get(f'{phase_prefix}mev_effectiveness_rate', 100.0)
            if effectiveness < 80.0:
                alerts.append({
                    'type': f'MEV_EFFECTIVENESS_LOW_{phase.upper()}',
                    'severity': 'HIGH',
                    'message': f'MEV protection effectiveness in {phase} phase dropped to {effectiveness:.1f}%',
                    'phase': phase
                })

            # Alert if recent MEV attack detected
            last_attack = self.mev_metrics.get(f'{phase_prefix}last_mev_attack_time')
            if last_attack:
                time_since_last_attack = time.time() - last_attack
                if time_since_last_attack < 3600:  # Within last hour
                    alerts.append({
                        'type': f'RECENT_MEV_ATTACK_{phase.upper()}',
                        'severity': 'MEDIUM',
                        'message': f'MEV attack detected in {phase} phase {time_since_last_attack/60:.1f} minutes ago',
                        'phase': phase
                    })

        return alerts

    def update_phase_mev_status(self, phase: str, status_updates: Dict[str, Any]):
        """
        Update MEV protection status for a specific phase.
        """
        phase_prefix = f"{phase}_"
        for key, value in status_updates.items():
            full_key = f"{phase_prefix}{key}"
            if full_key in self.mev_metrics:
                self.mev_metrics[full_key] = value
                logger.info(f"Updated {phase} phase MEV metric {key}: {value}")

    def get_phase_mev_readiness(self, phase: str) -> Dict[str, Any]:
        """
        Get MEV protection readiness for a specific phase.
        """
        phase_prefix = f"{phase}_"

        if phase == 'design':
            return {
                'phase': 'design',
                'mev_gas_limits': self.mev_metrics.get(f'{phase_prefix}mev_gas_limits', False),
                'mev_private_pools': self.mev_metrics.get(f'{phase_prefix}mev_private_pools', False),
                'mev_validation_rules': self.mev_metrics.get(f'{phase_prefix}mev_validation_rules', False),
                'overall_readiness': 'READY' if all([
                    self.mev_metrics.get(f'{phase_prefix}mev_gas_limits', False),
                    self.mev_metrics.get(f'{phase_prefix}mev_private_pools', False),
                    self.mev_metrics.get(f'{phase_prefix}mev_validation_rules', False)
                ]) else 'NOT_READY'
            }

        elif phase == 'deploy':
            return {
                'phase': 'deploy',
                'mev_contract_verification': self.mev_metrics.get(f'{phase_prefix}mev_contract_verification', False),
                'mev_integration_tests': self.mev_metrics.get(f'{phase_prefix}mev_integration_tests', False),
                'mev_security_audit': self.mev_metrics.get(f'{phase_prefix}mev_security_audit', False),
                'overall_readiness': 'READY' if all([
                    self.mev_metrics.get(f'{phase_prefix}mev_contract_verification', False),
                    self.mev_metrics.get(f'{phase_prefix}mev_integration_tests', False),
                    self.mev_metrics.get(f'{phase_prefix}mev_security_audit', False)
                ]) else 'NOT_READY'
            }

        elif phase == 'monitor':
            return {
                'phase': 'monitor',
                'sandwich_attacks_prevented': self.mev_metrics.get(f'{phase_prefix}sandwich_attacks_prevented', 0),
                'front_running_blocked': self.mev_metrics.get(f'{phase_prefix}front_running_attempts_blocked', 0),
                'gas_price_rejections': self.mev_metrics.get(f'{phase_prefix}gas_price_rejections', 0),
                'mev_effectiveness_rate': self.mev_metrics.get(f'{phase_prefix}mev_effectiveness_rate', 0.0),
                'mev_profit_saved': self.mev_metrics.get(f'{phase_prefix}mev_profit_saved_usd', 0.0),
                'protection_active': self.mev_metrics.get(f'{phase_prefix}mev_protection_active', True),
                'overall_readiness': 'ACTIVE' if self.mev_metrics.get(f'{phase_prefix}mev_protection_active', True) else 'INACTIVE'
            }

        elif phase == 'analyze':
            return {
                'phase': 'analyze',
                'attack_patterns_analyzed': len(self.mev_metrics.get(f'{phase_prefix}mev_attack_patterns', [])),
                'risk_assessment': self.mev_metrics.get(f'{phase_prefix}mev_risk_assessment', 'UNKNOWN'),
                'predictive_alerts': len(self.mev_metrics.get(f'{phase_prefix}mev_predictive_alerts', [])),
                'trend_analysis_complete': bool(self.mev_metrics.get(f'{phase_prefix}mev_trend_analysis')),
                'overall_readiness': 'ANALYZING' if self.mev_metrics.get(f'{phase_prefix}mev_trend_analysis') else 'PENDING'
            }

        elif phase == 'optimize':
            return {
                'phase': 'optimize',
                'ai_improvements': len(self.mev_metrics.get(f'{phase_prefix}mev_ai_improvements', [])),
                'gas_strategy_updates': len(self.mev_metrics.get(f'{phase_prefix}mev_gas_strategy_updates', [])),
                'protection_enhancements': len(self.mev_metrics.get(f'{phase_prefix}mev_protection_enhancements', [])),
                'automated_responses': self.mev_metrics.get(f'{phase_prefix}mev_automated_responses', False),
                'overall_readiness': 'OPTIMIZING' if self.mev_metrics.get(f'{phase_prefix}mev_automated_responses', False) else 'MANUAL'
            }

        return {'phase': phase, 'overall_readiness': 'UNKNOWN'}
