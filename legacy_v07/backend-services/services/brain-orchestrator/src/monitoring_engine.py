import time
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class MonitoringEngine:
    """
    Phase 5.2: Monitoring & Alerting
    Implements comprehensive monitoring, performance tracking, and automated alerting.
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