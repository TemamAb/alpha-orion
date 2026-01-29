"""
Compliance and Monitoring Engine
Implements automated KYC/AML, sanctions screening, and SLO monitoring for 99.95% uptime
"""

import asyncio
import aiohttp
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal
import logging
import json

logger = logging.getLogger(__name__)


@dataclass
class ComplianceCheck:
    """Compliance check result"""
    address: str
    check_type: str  # 'KYC', 'AML', 'SANCTIONS'
    passed: bool
    risk_score: float  # 0-100
    flags: List[str]
    timestamp: datetime


@dataclass
class SLOMetrics:
    """SLO metrics"""
    uptime_pct: float
    p99_latency_ms: float
    error_rate_pct: float
    total_requests: int
    successful_requests: int
    failed_requests: int
    period_start: datetime
    period_end: datetime


class ComplianceMonitoringEngine:
    """
    Enterprise compliance and monitoring engine
    
    Features:
    - Automated KYC/AML checks
    - Sanctions screening (OFAC, UN, EU)
    - Transaction monitoring
    - SLO tracking (99.95% uptime target)
    - Real-time alerting
    - Audit trail generation
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        
        # Compliance parameters
        self.kyc_required = config.get('KYC_REQUIRED', True)
        self.aml_threshold = Decimal('10000')  # $10K threshold
        self.sanctions_check_enabled = True
        
        # SLO targets
        self.target_uptime_pct = 99.95
        self.target_p99_latency_ms = 100
        self.target_error_rate_pct = 0.1
        
        # Sanctions lists (simplified - would integrate with real APIs)
        self.sanctions_lists = {
            'OFAC': set(),  # US Office of Foreign Assets Control
            'UN': set(),    # United Nations
            'EU': set()     # European Union
        }
        
        # Compliance cache
        self.compliance_cache: Dict[str, ComplianceCheck] = {}
        self.cache_ttl_hours = 24
        
        # SLO tracking
        self.request_log: List[Dict[str, Any]] = []
        self.uptime_log: List[Dict[str, Any]] = []
        
        # Audit trail
        self.audit_trail: List[Dict[str, Any]] = []
        
        logger.info("ComplianceMonitoringEngine initialized")
    
    async def check_address_compliance(
        self,
        address: str,
        amount: Optional[Decimal] = None
    ) -> ComplianceCheck:
        """
        Comprehensive compliance check for an address
        
        Checks:
        1. KYC verification
        2. AML screening
        3. Sanctions list screening
        """
        
        # Check cache first
        if address in self.compliance_cache:
            cached = self.compliance_cache[address]
            if datetime.now() - cached.timestamp < timedelta(hours=self.cache_ttl_hours):
                logger.debug(f"Using cached compliance check for {address}")
                return cached
        
        flags = []
        risk_score = 0.0
        
        # 1. KYC Check
        if self.kyc_required:
            kyc_passed, kyc_risk = await self._check_kyc(address)
            if not kyc_passed:
                flags.append('KYC_FAILED')
                risk_score += kyc_risk
        
        # 2. AML Check
        if amount and amount > self.aml_threshold:
            aml_passed, aml_risk = await self._check_aml(address, amount)
            if not aml_passed:
                flags.append('AML_SUSPICIOUS')
                risk_score += aml_risk
        
        # 3. Sanctions Check
        sanctions_passed, sanctions_risk = await self._check_sanctions(address)
        if not sanctions_passed:
            flags.append('SANCTIONS_HIT')
            risk_score += sanctions_risk
        
        # Determine overall pass/fail
        passed = len(flags) == 0 and risk_score < 50
        
        result = ComplianceCheck(
            address=address,
            check_type='COMPREHENSIVE',
            passed=passed,
            risk_score=min(risk_score, 100.0),
            flags=flags,
            timestamp=datetime.now()
        )
        
        # Cache result
        self.compliance_cache[address] = result
        
        # Log to audit trail
        self._log_audit_event('COMPLIANCE_CHECK', {
            'address': address,
            'passed': passed,
            'risk_score': risk_score,
            'flags': flags
        })
        
        logger.info(
            f"Compliance check for {address}: "
            f"{'PASSED' if passed else 'FAILED'}, "
            f"risk score: {risk_score:.1f}"
        )
        
        return result
    
    async def _check_kyc(self, address: str) -> tuple[bool, float]:
        """Check KYC status"""
        # In production, integrate with KYC provider (e.g., Chainalysis, Elliptic)
        
        # Simulate KYC check
        # Most addresses pass KYC
        import random
        passed = random.random() > 0.05  # 95% pass rate
        risk_score = 0 if passed else 30
        
        return passed, risk_score
    
    async def _check_aml(self, address: str, amount: Decimal) -> tuple[bool, float]:
        """Check AML status"""
        # In production, integrate with AML provider
        
        # Simulate AML check based on amount
        # Higher amounts = higher scrutiny
        risk_score = float(amount / Decimal('100000') * 10)  # 10 points per $100K
        
        # Flag if risk score too high
        passed = risk_score < 30
        
        return passed, risk_score
    
    async def _check_sanctions(self, address: str) -> tuple[bool, float]:
        """Check sanctions lists"""
        # In production, integrate with sanctions screening API
        
        # Check all sanctions lists
        for list_name, addresses in self.sanctions_lists.items():
            if address.lower() in addresses:
                logger.critical(f"SANCTIONS HIT: {address} on {list_name} list")
                return False, 100.0  # Maximum risk
        
        return True, 0.0
    
    async def monitor_transaction(
        self,
        tx_hash: str,
        from_address: str,
        to_address: str,
        amount: Decimal,
        token: str
    ):
        """Monitor transaction for compliance"""
        
        # Check both addresses
        from_check = await self.check_address_compliance(from_address, amount)
        to_check = await self.check_address_compliance(to_address, amount)
        
        # Log transaction
        self._log_audit_event('TRANSACTION_MONITORED', {
            'tx_hash': tx_hash,
            'from_address': from_address,
            'to_address': to_address,
            'amount': float(amount),
            'token': token,
            'from_compliance': from_check.passed,
            'to_compliance': to_check.passed
        })
        
        # Alert if either address failed
        if not from_check.passed or not to_check.passed:
            await self._send_compliance_alert(
                'SUSPICIOUS_TRANSACTION',
                {
                    'tx_hash': tx_hash,
                    'from_check': from_check,
                    'to_check': to_check
                }
            )
    
    async def track_slo_request(
        self,
        endpoint: str,
        latency_ms: float,
        success: bool
    ):
        """Track request for SLO monitoring"""
        
        self.request_log.append({
            'timestamp': datetime.now(),
            'endpoint': endpoint,
            'latency_ms': latency_ms,
            'success': success
        })
        
        # Keep only last 10,000 requests
        if len(self.request_log) > 10000:
            self.request_log = self.request_log[-10000:]
    
    async def track_uptime_event(self, is_up: bool):
        """Track uptime event"""
        
        self.uptime_log.append({
            'timestamp': datetime.now(),
            'is_up': is_up
        })
        
        # Keep only last 24 hours
        cutoff = datetime.now() - timedelta(hours=24)
        self.uptime_log = [
            event for event in self.uptime_log
            if event['timestamp'] > cutoff
        ]
    
    async def get_slo_metrics(
        self,
        period_hours: int = 24
    ) -> SLOMetrics:
        """Calculate SLO metrics for specified period"""
        
        period_start = datetime.now() - timedelta(hours=period_hours)
        period_end = datetime.now()
        
        # Filter requests in period
        period_requests = [
            req for req in self.request_log
            if req['timestamp'] > period_start
        ]
        
        if not period_requests:
            return SLOMetrics(
                uptime_pct=100.0,
                p99_latency_ms=0.0,
                error_rate_pct=0.0,
                total_requests=0,
                successful_requests=0,
                failed_requests=0,
                period_start=period_start,
                period_end=period_end
            )
        
        # Calculate metrics
        total_requests = len(period_requests)
        successful_requests = sum(1 for req in period_requests if req['success'])
        failed_requests = total_requests - successful_requests
        
        error_rate_pct = (failed_requests / total_requests * 100) if total_requests > 0 else 0
        
        # Calculate P99 latency
        latencies = sorted([req['latency_ms'] for req in period_requests])
        p99_index = int(len(latencies) * 0.99)
        p99_latency_ms = latencies[p99_index] if latencies else 0
        
        # Calculate uptime
        period_uptime = [
            event for event in self.uptime_log
            if event['timestamp'] > period_start
        ]
        
        if period_uptime:
            uptime_pct = sum(1 for e in period_uptime if e['is_up']) / len(period_uptime) * 100
        else:
            uptime_pct = 100.0
        
        metrics = SLOMetrics(
            uptime_pct=uptime_pct,
            p99_latency_ms=p99_latency_ms,
            error_rate_pct=error_rate_pct,
            total_requests=total_requests,
            successful_requests=successful_requests,
            failed_requests=failed_requests,
            period_start=period_start,
            period_end=period_end
        )
        
        # Check SLO violations
        await self._check_slo_violations(metrics)
        
        return metrics
    
    async def _check_slo_violations(self, metrics: SLOMetrics):
        """Check for SLO violations and alert"""
        
        violations = []
        
        if metrics.uptime_pct < self.target_uptime_pct:
            violations.append(
                f"Uptime {metrics.uptime_pct:.2f}% < target {self.target_uptime_pct}%"
            )
        
        if metrics.p99_latency_ms > self.target_p99_latency_ms:
            violations.append(
                f"P99 latency {metrics.p99_latency_ms:.2f}ms > target {self.target_p99_latency_ms}ms"
            )
        
        if metrics.error_rate_pct > self.target_error_rate_pct:
            violations.append(
                f"Error rate {metrics.error_rate_pct:.2f}% > target {self.target_error_rate_pct}%"
            )
        
        if violations:
            await self._send_slo_alert(violations, metrics)
    
    async def _send_compliance_alert(self, alert_type: str, data: Dict[str, Any]):
        """Send compliance alert"""
        
        alert = {
            'type': alert_type,
            'timestamp': datetime.now().isoformat(),
            'data': data,
            'severity': 'CRITICAL'
        }
        
        logger.critical(f"COMPLIANCE ALERT: {json.dumps(alert, indent=2, default=str)}")
        
        # In production, send to PagerDuty, Slack, etc.
    
    async def _send_slo_alert(self, violations: List[str], metrics: SLOMetrics):
        """Send SLO violation alert"""
        
        alert = {
            'type': 'SLO_VIOLATION',
            'timestamp': datetime.now().isoformat(),
            'violations': violations,
            'metrics': {
                'uptime_pct': metrics.uptime_pct,
                'p99_latency_ms': metrics.p99_latency_ms,
                'error_rate_pct': metrics.error_rate_pct
            },
            'severity': 'HIGH'
        }
        
        logger.error(f"SLO ALERT: {json.dumps(alert, indent=2)}")
        
        # In production, send to monitoring system
    
    def _log_audit_event(self, event_type: str, data: Dict[str, Any]):
        """Log event to audit trail"""
        
        event = {
            'timestamp': datetime.now().isoformat(),
            'type': event_type,
            'data': data
        }
        
        self.audit_trail.append(event)
        
        # Keep only last 100,000 events
        if len(self.audit_trail) > 100000:
            self.audit_trail = self.audit_trail[-100000:]
    
    async def generate_compliance_report(
        self,
        period_hours: int = 24
    ) -> Dict[str, Any]:
        """Generate compliance report"""
        
        period_start = datetime.now() - timedelta(hours=period_hours)
        
        # Filter audit events in period
        period_events = [
            event for event in self.audit_trail
            if datetime.fromisoformat(event['timestamp']) > period_start
        ]
        
        # Count by type
        event_counts = {}
        for event in period_events:
            event_type = event['type']
            event_counts[event_type] = event_counts.get(event_type, 0) + 1
        
        # Count compliance checks
        compliance_checks = [
            e for e in period_events
            if e['type'] == 'COMPLIANCE_CHECK'
        ]
        
        passed_checks = sum(
            1 for e in compliance_checks
            if e['data'].get('passed', False)
        )
        
        return {
            'period_start': period_start.isoformat(),
            'period_end': datetime.now().isoformat(),
            'total_events': len(period_events),
            'event_counts': event_counts,
            'compliance_checks': {
                'total': len(compliance_checks),
                'passed': passed_checks,
                'failed': len(compliance_checks) - passed_checks,
                'pass_rate_pct': (passed_checks / len(compliance_checks) * 100) if compliance_checks else 100
            }
        }
    
    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get compliance engine performance metrics"""
        
        slo_metrics = await self.get_slo_metrics(24)
        
        return {
            'compliance': {
                'cached_addresses': len(self.compliance_cache),
                'kyc_required': self.kyc_required,
                'aml_threshold': float(self.aml_threshold),
                'sanctions_lists': len(self.sanctions_lists)
            },
            'slo': {
                'uptime_pct': slo_metrics.uptime_pct,
                'p99_latency_ms': slo_metrics.p99_latency_ms,
                'error_rate_pct': slo_metrics.error_rate_pct,
                'target_uptime_pct': self.target_uptime_pct,
                'target_p99_latency_ms': self.target_p99_latency_ms,
                'target_error_rate_pct': self.target_error_rate_pct
            },
            'audit': {
                'total_events': len(self.audit_trail)
            }
        }
