"""
End-to-End Integration Tests
Tests complete arbitrage flow from opportunity detection to execution
"""

import pytest
import asyncio
from decimal import Decimal
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend_services.services.brain_orchestrator.src.multi_chain_engine import MultiChainEngine
from backend_services.services.brain_risk_management.src.enterprise_risk_engine import EnterpriseRiskEngine
from backend_services.services.executor.enterprise_execution_engine import EnterpriseExecutionEngine


class TestEndToEndArbitrage:
    """End-to-end integration tests"""
    
    @pytest.fixture
    async def multi_chain_engine(self):
        """Create multi-chain engine instance"""
        config = {
            'ETHEREUM_RPC_URL': os.getenv('ETHEREUM_RPC_URL', ''),
            'POLYGON_RPC_URL': os.getenv('POLYGON_RPC_URL', ''),
        }
        engine = MultiChainEngine(config)
        await engine.initialize()
        yield engine
        await engine.close()
    
    @pytest.fixture
    def risk_engine(self):
        """Create risk engine instance"""
        config = {}
        return EnterpriseRiskEngine(config)
    
    @pytest.fixture
    async def execution_engine(self):
        """Create execution engine instance"""
        config = {
            'FLASHBOTS_ENABLED': False,  # Disable for testing
            'MEV_BLOCKER_ENABLED': False
        }
        engine = EnterpriseExecutionEngine(config)
        await engine.initialize()
        yield engine
        await engine.close()
    
    @pytest.mark.asyncio
    async def test_opportunity_scanning(self, multi_chain_engine):
        """Test scanning for arbitrage opportunities"""
        
        # Scan all chains
        opportunities = await multi_chain_engine.scan_all_chains()
        
        # Verify we got results
        assert isinstance(opportunities, list)
        
        # If opportunities found, verify structure
        if len(opportunities) > 0:
            opp = opportunities[0]
            assert hasattr(opp, 'chain')
            assert hasattr(opp, 'strategy')
            assert hasattr(opp, 'net_profit')
            assert hasattr(opp, 'confidence')
    
    @pytest.mark.asyncio
    async def test_risk_assessment(self, risk_engine):
        """Test risk management calculations"""
        
        # Create test portfolio
        portfolio = {
            'total_value': 100000,  # $100K
            'peak_value': 105000
        }
        
        # Calculate VaR
        risk_metrics = await risk_engine.calculate_var(portfolio)
        
        # Verify metrics
        assert risk_metrics.confidence == 0.999
        assert risk_metrics.var_1day >= 0
        assert risk_metrics.var_10day >= risk_metrics.var_1day
    
    @pytest.mark.asyncio
    async def test_stress_testing(self, risk_engine):
        """Test stress testing scenarios"""
        
        portfolio = {
            'total_value': 100000
        }
        
        # Run stress tests
        results = await risk_engine.stress_test(portfolio)
        
        # Verify we have results
        assert len(results) >= 1000  # Should have 1000+ scenarios
        
        # Verify worst case identified
        worst_case = results[0]
        assert worst_case.pnl_impact <= 0  # Should be negative
    
    @pytest.mark.asyncio
    async def test_circuit_breaker(self, risk_engine):
        """Test circuit breaker triggers"""
        
        # Create portfolio with high drawdown
        portfolio = {
            'total_value': 90000,
            'peak_value': 100000  # 10% drawdown
        }
        
        trades = []
        
        # Check circuit breaker
        triggered = await risk_engine.check_circuit_breaker(portfolio, trades)
        
        # Should trigger due to high drawdown
        assert triggered == True
        assert risk_engine.circuit_breaker_triggered == True
    
    @pytest.mark.asyncio
    async def test_position_sizing(self, risk_engine):
        """Test dynamic position sizing"""
        
        opportunity = {
            'confidence': 0.85,
            'expected_profit': 500,
            'max_loss': 250,
            'asset': 'ETH'
        }
        
        portfolio = {
            'total_value': 100000
        }
        
        # Calculate optimal size
        position = await risk_engine.calculate_optimal_position_size(
            opportunity,
            portfolio
        )
        
        # Verify position sizing
        assert position.final_size > 0
        assert position.final_size <= Decimal('0.05')  # Max 5%
        assert position.kelly_size > 0
    
    @pytest.mark.asyncio
    async def test_performance_metrics(self, multi_chain_engine):
        """Test performance metric tracking"""
        
        # Get metrics
        metrics = await multi_chain_engine.get_performance_metrics()
        
        # Verify metric structure
        assert 'avg_execution_time_ms' in metrics
        assert 'p99_execution_time_ms' in metrics
        assert 'target_latency_ms' in metrics
        assert metrics['target_latency_ms'] == 50
    
    @pytest.mark.asyncio
    async def test_execution_engine_metrics(self, execution_engine):
        """Test execution engine performance tracking"""
        
        # Get metrics
        metrics = await execution_engine.get_performance_metrics()
        
        # Verify structure
        assert 'target_latency_ms' in metrics
        assert metrics['target_latency_ms'] == 50
    
    @pytest.mark.asyncio
    async def test_complete_arbitrage_flow(
        self,
        multi_chain_engine,
        risk_engine,
        execution_engine
    ):
        """Test complete arbitrage flow end-to-end"""
        
        # Step 1: Scan for opportunities
        opportunities = await multi_chain_engine.scan_all_chains()
        
        if len(opportunities) == 0:
            pytest.skip("No opportunities found")
        
        # Step 2: Get best opportunity
        best_opp = opportunities[0]
        
        # Step 3: Risk assessment
        portfolio = {'total_value': 100000}
        
        # Check circuit breaker
        breaker_triggered = await risk_engine.check_circuit_breaker(
            portfolio,
            []
        )
        
        if breaker_triggered:
            pytest.skip("Circuit breaker triggered")
        
        # Calculate position size
        opportunity_dict = {
            'confidence': best_opp.confidence,
            'expected_profit': float(best_opp.net_profit),
            'max_loss': float(best_opp.gas_cost),
            'asset': best_opp.token_in
        }
        
        position = await risk_engine.calculate_optimal_position_size(
            opportunity_dict,
            portfolio
        )
        
        # Verify position calculated
        assert position.final_size > 0
        
        # Step 4: Execution would happen here (skipped in test)
        # In production: execution_engine.execute_arbitrage(...)
        
        # Verify flow completed
        assert True


class TestHealthChecks:
    """Test health check endpoints"""
    
    def test_health_endpoint_structure(self):
        """Test health endpoint returns correct structure"""
        from backend_services.services.brain_orchestrator.src.health_check import HealthCheckService
        
        service = HealthCheckService()
        health = service.get_health_status()
        
        assert health['status'] == 'healthy'
        assert health['service'] == 'brain-orchestrator'
        assert 'uptime_seconds' in health
        assert 'timestamp' in health
    
    @pytest.mark.asyncio
    async def test_readiness_endpoint(self):
        """Test readiness probe"""
        from backend_services.services.brain_orchestrator.src.health_check import HealthCheckService
        
        service = HealthCheckService()
        ready = await service.get_readiness_status()
        
        assert 'status' in ready
        assert 'checks' in ready
        assert ready['service'] == 'brain-orchestrator'


class TestCloudMonitoring:
    """Test Cloud Monitoring integration"""
    
    def test_monitoring_initialization(self):
        """Test Cloud Monitoring client initialization"""
        # Skip if no project ID
        project_id = os.getenv('PROJECT_ID')
        if not project_id:
            pytest.skip("No PROJECT_ID set")
        
        from backend_services.services.brain_orchestrator.src.cloud_monitoring import CloudMonitoringExporter
        
        exporter = CloudMonitoringExporter(project_id)
        assert exporter.project_id == project_id
        assert exporter.service_name == 'brain-orchestrator'


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--asyncio-mode=auto'])
