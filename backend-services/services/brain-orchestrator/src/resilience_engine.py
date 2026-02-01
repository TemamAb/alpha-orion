import time
import logging
from enum import Enum
from typing import Dict, Callable, Any, Optional

logger = logging.getLogger(__name__)

class CircuitState(Enum):
    CLOSED = "CLOSED"   # Normal operation
    OPEN = "OPEN"       # Circuit tripped, failing fast
    HALF_OPEN = "HALF_OPEN" # Testing recovery

class CircuitBreaker:
    """
    Phase 5.1: Circuit Breakers & Failover
    Implements circuit breaker pattern to prevent cascading failures.
    """
    
    def __init__(self, name: str, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = 0
        self.fallback_function = None

    def set_fallback(self, fallback_func: Callable):
        self.fallback_function = fallback_func

    def record_success(self):
        if self.state == CircuitState.HALF_OPEN:
            logger.info(f"Circuit {self.name} recovered. State: CLOSED")
            self.state = CircuitState.CLOSED
            self.failure_count = 0
        elif self.state == CircuitState.CLOSED:
            self.failure_count = 0

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.state == CircuitState.CLOSED and self.failure_count >= self.failure_threshold:
            logger.warning(f"Circuit {self.name} tripped. State: OPEN")
            self.state = CircuitState.OPEN
        elif self.state == CircuitState.HALF_OPEN:
            logger.warning(f"Circuit {self.name} recovery failed. State: OPEN")
            self.state = CircuitState.OPEN

    def allow_request(self) -> bool:
        if self.state == CircuitState.CLOSED:
            return True
            
        if self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time > self.recovery_timeout:
                logger.info(f"Circuit {self.name} attempting recovery. State: HALF_OPEN")
                self.state = CircuitState.HALF_OPEN
                return True
            return False
            
        if self.state == CircuitState.HALF_OPEN:
            # In a real implementation, we might limit concurrency here
            return True
            
        return False

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        if not self.allow_request():
            if self.fallback_function:
                logger.info(f"Circuit {self.name} OPEN. Executing fallback.")
                return await self.fallback_function(*args, **kwargs)
            raise Exception(f"Circuit {self.name} is OPEN")

        try:
            result = await func(*args, **kwargs)
            self.record_success()
            return result
        except Exception as e:
            self.record_failure()
            raise e

class FailoverManager:
    """
    Manages failover strategies for critical services.
    """
    
    def __init__(self):
        self.primary_endpoints = {}
        self.backup_endpoints = {}
        self.active_endpoints = {}

    def register_service(self, service_name: str, primary: str, backup: str):
        self.primary_endpoints[service_name] = primary
        self.backup_endpoints[service_name] = backup
        self.active_endpoints[service_name] = primary

    def switch_to_backup(self, service_name: str):
        if service_name in self.backup_endpoints:
            logger.warning(f"Switching {service_name} to BACKUP endpoint.")
            self.active_endpoints[service_name] = self.backup_endpoints[service_name]
            return True
        return False

    def switch_to_primary(self, service_name: str):
        if service_name in self.primary_endpoints:
            logger.info(f"Switching {service_name} to PRIMARY endpoint.")
            self.active_endpoints[service_name] = self.primary_endpoints[service_name]
            return True
        return False

    def get_active_endpoint(self, service_name: str) -> str:
        return self.active_endpoints.get(service_name)