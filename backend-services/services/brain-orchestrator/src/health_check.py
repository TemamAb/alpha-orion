"""
Health Check and Readiness Probe Endpoints
Provides /health and /ready endpoints for Kubernetes/Cloud Run
"""

from flask import Flask, jsonify
from typing import Dict, Any
import asyncio
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class HealthCheckService:
    """Health check service for monitoring"""
    
    def __init__(self, multi_chain_engine=None, risk_engine=None):
        self.multi_chain_engine = multi_chain_engine
        self.risk_engine = risk_engine
        self.start_time = datetime.now()
        
    def get_health_status(self) -> Dict[str, Any]:
        """Get basic health status"""
        uptime_seconds = (datetime.now() - self.start_time).total_seconds()
        
        return {
            "status": "healthy",
            "service": "brain-orchestrator",
            "version": "2.0.0",
            "uptime_seconds": uptime_seconds,
            "timestamp": datetime.now().isoformat()
        }
    
    async def get_readiness_status(self) -> Dict[str, Any]:
        """Get detailed readiness status with dependency checks"""
        
        checks = {
            "multi_chain_engine": False,
            "risk_engine": False,
            "database": False,
            "redis": False
        }
        
        # Check multi-chain engine
        if self.multi_chain_engine:
            try:
                chains_connected = len(self.multi_chain_engine.web3_instances)
                checks["multi_chain_engine"] = chains_connected > 0
            except Exception as e:
                logger.error(f"Multi-chain engine check failed: {e}")
        
        # Check risk engine
        if self.risk_engine:
            try:
                checks["risk_engine"] = not self.risk_engine.circuit_breaker_triggered
            except Exception as e:
                logger.error(f"Risk engine check failed: {e}")
        
        # Overall ready status
        all_ready = all(checks.values())
        
        return {
            "status": "ready" if all_ready else "not_ready",
            "service": "brain-orchestrator",
            "checks": checks,
            "timestamp": datetime.now().isoformat()
        }


def create_health_app(multi_chain_engine=None, risk_engine=None) -> Flask:
    """Create Flask app with health check endpoints"""
    
    app = Flask(__name__)
    health_service = HealthCheckService(multi_chain_engine, risk_engine)
    
    @app.route('/health', methods=['GET'])
    def health():
        """Basic health check endpoint"""
        return jsonify(health_service.get_health_status()), 200
    
    @app.route('/ready', methods=['GET'])
    def ready():
        """Readiness probe endpoint"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        status = loop.run_until_complete(health_service.get_readiness_status())
        loop.close()
        
        status_code = 200 if status["status"] == "ready" else 503
        return jsonify(status), status_code
    
    @app.route('/metrics', methods=['GET'])
    def metrics():
        """Prometheus-compatible metrics endpoint"""
        metrics_data = {
            "uptime_seconds": (datetime.now() - health_service.start_time).total_seconds(),
            "service": "brain-orchestrator",
            "version": "2.0.0"
        }
        
        # Add engine metrics if available
        if multi_chain_engine:
            try:
                perf = asyncio.run(multi_chain_engine.get_performance_metrics())
                metrics_data.update({
                    "avg_execution_time_ms": perf.get("avg_execution_time_ms", 0),
                    "p99_execution_time_ms": perf.get("p99_execution_time_ms", 0),
                    "total_scans": perf.get("total_scans", 0)
                })
            except:
                pass
        
        return jsonify(metrics_data), 200
    
    return app
