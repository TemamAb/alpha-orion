import logging
import math
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class AutoScalingEngine:
    """
    Phase 5.3: Auto-scaling & Load Balancing
    Implements horizontal auto-scaling logic, load balancing strategies, and capacity planning.
    """
    
    def __init__(self):
        self.min_instances = 1
        self.max_instances = 100
        self.target_cpu_utilization = 0.70
        self.target_memory_utilization = 0.80
        self.current_instances = {} # service_name -> count
        self.metrics_history = {} # service_name -> list of metrics

    def calculate_desired_instances(self, service_name: str, current_cpu: float, current_memory: float, current_requests_per_sec: float) -> int:
        """
        Calculate the desired number of instances based on current metrics.
        """
        current_count = self.current_instances.get(service_name, self.min_instances)
        
        # CPU-based scaling
        cpu_ratio = current_cpu / self.target_cpu_utilization
        desired_cpu = math.ceil(current_count * cpu_ratio)
        
        # Memory-based scaling
        memory_ratio = current_memory / self.target_memory_utilization
        desired_memory = math.ceil(current_count * memory_ratio)
        
        # Throughput-based scaling (simplified)
        # Assuming 1 instance can handle 1000 RPS
        desired_throughput = math.ceil(current_requests_per_sec / 1000)
        
        desired_count = max(desired_cpu, desired_memory, desired_throughput, self.min_instances)
        desired_count = min(desired_count, self.max_instances)
        
        if desired_count != current_count:
            logger.info(f"Scaling {service_name}: {current_count} -> {desired_count} instances (CPU: {current_cpu:.2f}, Mem: {current_memory:.2f}, RPS: {current_requests_per_sec})")
            
        self.current_instances[service_name] = desired_count
        return desired_count

    def get_load_balancing_strategy(self, service_name: str) -> str:
        """
        Determine the best load balancing strategy for a service.
        """
        # For stateful services, use session affinity
        if service_name in ["order-management-service", "brain-strategy-engine"]:
            return "SESSION_AFFINITY"
        
        # For stateless, high-throughput services, use round-robin or least-connections
        return "ROUND_ROBIN"

    def predict_capacity_needs(self, service_name: str) -> Dict[str, float]:
        """
        Predict future capacity needs based on historical metrics (Capacity Planning).
        """
        history = self.metrics_history.get(service_name, [])
        if not history:
            return {"predicted_instances": self.min_instances, "confidence": 0.0}
            
        # Simple linear regression or moving average for prediction
        # This is a placeholder for more complex ML-based prediction
        avg_load = sum([m['load'] for m in history]) / len(history)
        trend = 0.0
        if len(history) > 1:
            trend = history[-1]['load'] - history[0]['load']
            
        predicted_load = avg_load + trend
        predicted_instances = math.ceil(predicted_load * self.current_instances.get(service_name, 1))
        
        return {
            "predicted_instances": min(max(predicted_instances, self.min_instances), self.max_instances),
            "trend": "INCREASING" if trend > 0 else "DECREASING",
            "confidence": 0.8 # Placeholder
        }

    def record_metrics(self, service_name: str, load_metric: float):
        """
        Record metrics for capacity planning.
        """
        if service_name not in self.metrics_history:
            self.metrics_history[service_name] = []
            
        self.metrics_history[service_name].append({
            'timestamp': datetime.now(),
            'load': load_metric
        })
        
        # Keep history limited
        if len(self.metrics_history[service_name]) > 1000:
            self.metrics_history[service_name].pop(0)

class LoadBalancer:
    """
    Software Load Balancer logic.
    """
    def __init__(self):
        self.backends = {} # service -> list of endpoints
        self.current_index = {} # service -> index for round robin
        self.sessions = {} # session_id -> endpoint

    def register_backend(self, service: str, endpoints: List[str]):
        self.backends[service] = endpoints
        self.current_index[service] = 0

    def get_endpoint(self, service: str, session_id: Optional[str] = None, strategy: str = "ROUND_ROBIN") -> Optional[str]:
        endpoints = self.backends.get(service, [])
        if not endpoints:
            return None
            
        if strategy == "SESSION_AFFINITY" and session_id:
            if session_id in self.sessions:
                # Check if endpoint is still valid
                if self.sessions[session_id] in endpoints:
                    return self.sessions[session_id]
            
            # Assign new endpoint
            import hashlib
            hash_val = int(hashlib.md5(session_id.encode()).hexdigest(), 16)
            endpoint = endpoints[hash_val % len(endpoints)]
            self.sessions[session_id] = endpoint
            return endpoint
            
        if strategy == "ROUND_ROBIN":
            idx = self.current_index[service]
            endpoint = endpoints[idx]
            self.current_index[service] = (idx + 1) % len(endpoints)
            return endpoint
            
        # Default to random
        import random
        return random.choice(endpoints)