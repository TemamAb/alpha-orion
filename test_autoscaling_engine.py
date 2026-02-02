import unittest
from datetime import datetime
import sys
import os

# Add project root to path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend-services/services/brain-orchestrator/src')))

from autoscaling_engine import AutoScalingEngine, LoadBalancer

class TestAutoScalingEngine(unittest.TestCase):
    def setUp(self):
        self.engine = AutoScalingEngine()
        self.engine.current_instances['test-service'] = 10

    def test_cpu_scaling(self):
        # Target CPU is 0.70. Current is 0.84 (20% higher). Should scale up.
        # 10 * (0.84 / 0.70) = 12
        desired = self.engine.calculate_desired_instances('test-service', 0.84, 0.50, 1000)
        self.assertEqual(desired, 12)

    def test_memory_scaling(self):
        # Target Mem is 0.80. Current is 0.96 (20% higher). Should scale up.
        # 10 * (0.96 / 0.80) = 12
        desired = self.engine.calculate_desired_instances('test-service', 0.50, 0.96, 1000)
        self.assertEqual(desired, 12)

    def test_throughput_scaling(self):
        # 1 instance per 1000 RPS. 15000 RPS needs 15 instances.
        desired = self.engine.calculate_desired_instances('test-service', 0.50, 0.50, 15000)
        self.assertEqual(desired, 15)

    def test_min_max_limits(self):
        # Test Min
        self.engine.current_instances['test-service'] = 1
        desired = self.engine.calculate_desired_instances('test-service', 0.01, 0.01, 1)
        self.assertEqual(desired, 1) # Should not go below min_instances (1)

        # Test Max
        self.engine.current_instances['test-service'] = 100
        desired = self.engine.calculate_desired_instances('test-service', 2.0, 2.0, 200000)
        self.assertEqual(desired, 100) # Should not go above max_instances (100)

    def test_capacity_prediction(self):
        # Record increasing load
        self.engine.record_metrics('test-service', 0.5)
        self.engine.record_metrics('test-service', 0.6)
        self.engine.record_metrics('test-service', 0.7)
        
        # Trend is +0.1 per step (roughly). Next should be around 0.8
        # Current instances = 10 (from setUp)
        # Predicted instances ~= 0.8 * 10 = 8
        
        prediction = self.engine.predict_capacity_needs('test-service')
        self.assertEqual(prediction['trend'], 'INCREASING')
        self.assertTrue(prediction['predicted_instances'] > 0)

class TestLoadBalancer(unittest.TestCase):
    def setUp(self):
        self.lb = LoadBalancer()
        self.lb.register_backend('api-service', ['10.0.0.1', '10.0.0.2', '10.0.0.3'])

    def test_round_robin(self):
        # Should cycle through endpoints
        ep1 = self.lb.get_endpoint('api-service', strategy="ROUND_ROBIN")
        ep2 = self.lb.get_endpoint('api-service', strategy="ROUND_ROBIN")
        ep3 = self.lb.get_endpoint('api-service', strategy="ROUND_ROBIN")
        ep4 = self.lb.get_endpoint('api-service', strategy="ROUND_ROBIN")

        self.assertEqual(ep1, '10.0.0.1')
        self.assertEqual(ep2, '10.0.0.2')
        self.assertEqual(ep3, '10.0.0.3')
        self.assertEqual(ep4, '10.0.0.1') # Wrap around

    def test_session_affinity(self):
        session_id = "user-123"
        
        # First call assigns endpoint
        ep1 = self.lb.get_endpoint('api-service', session_id=session_id, strategy="SESSION_AFFINITY")
        
        # Subsequent calls should return same endpoint
        ep2 = self.lb.get_endpoint('api-service', session_id=session_id, strategy="SESSION_AFFINITY")
        ep3 = self.lb.get_endpoint('api-service', session_id=session_id, strategy="SESSION_AFFINITY")
        
        self.assertEqual(ep1, ep2)
        self.assertEqual(ep2, ep3)
        
        # Different user gets different (or same based on hash) endpoint
        other_ep = self.lb.get_endpoint('api-service', session_id="user-456", strategy="SESSION_AFFINITY")
        # Note: Hash collision possible with small set, but logic holds

    def test_no_backends(self):
        endpoint = self.lb.get_endpoint('non-existent-service')
        self.assertIsNone(endpoint)

if __name__ == '__main__':
    unittest.main()