"""
Google Cloud Monitoring Integration
Exports custom metrics to Cloud Monitoring for dashboards and alerting
"""

from google.cloud import monitoring_v3
from google.api import metric_pb2 as ga_metric
from google.api import label_pb2 as ga_label
import time
from typing import Dict, Any, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class CloudMonitoringExporter:
    """Export custom metrics to Google Cloud Monitoring"""
    
    def __init__(self, project_id: str, service_name: str = "brain-orchestrator"):
        self.project_id = project_id
        self.service_name = service_name
        self.client = monitoring_v3.MetricServiceClient()
        self.project_name = f"projects/{project_id}"
        
        # Create custom metric descriptors
        self._create_metric_descriptors()
        
        logger.info(f"Cloud Monitoring initialized for project: {project_id}")
    
    def _create_metric_descriptors(self):
        """Create custom metric descriptors if they don't exist"""
        
        metrics = [
            {
                "type": "custom.googleapis.com/arbitrage/profit_rate",
                "metric_kind": monitoring_v3.MetricDescriptor.MetricKind.GAUGE,
                "value_type": monitoring_v3.MetricDescriptor.ValueType.DOUBLE,
                "unit": "USD/min",
                "description": "Arbitrage profit generation rate"
            },
            {
                "type": "custom.googleapis.com/arbitrage/execution_latency",
                "metric_kind": monitoring_v3.MetricDescriptor.MetricKind.GAUGE,
                "value_type": monitoring_v3.MetricDescriptor.ValueType.DOUBLE,
                "unit": "ms",
                "description": "Trade execution latency"
            },
            {
                "type": "custom.googleapis.com/arbitrage/success_rate",
                "metric_kind": monitoring_v3.MetricDescriptor.MetricKind.GAUGE,
                "value_type": monitoring_v3.MetricDescriptor.ValueType.DOUBLE,
                "unit": "%",
                "description": "Trade success rate"
            },
            {
                "type": "custom.googleapis.com/arbitrage/opportunities_found",
                "metric_kind": monitoring_v3.MetricDescriptor.MetricKind.CUMULATIVE,
                "value_type": monitoring_v3.MetricDescriptor.ValueType.INT64,
                "unit": "1",
                "description": "Total arbitrage opportunities found"
            },
            {
                "type": "custom.googleapis.com/arbitrage/total_profit",
                "metric_kind": monitoring_v3.MetricDescriptor.MetricKind.CUMULATIVE,
                "value_type": monitoring_v3.MetricDescriptor.ValueType.DOUBLE,
                "unit": "USD",
                "description": "Total profit generated"
            }
        ]
        
        for metric_config in metrics:
            try:
                descriptor = monitoring_v3.MetricDescriptor()
                descriptor.type = metric_config["type"]
                descriptor.metric_kind = metric_config["metric_kind"]
                descriptor.value_type = metric_config["value_type"]
                descriptor.unit = metric_config["unit"]
                descriptor.description = metric_config["description"]
                
                # Try to create (will fail if already exists, which is fine)
                try:
                    self.client.create_metric_descriptor(
                        name=self.project_name,
                        metric_descriptor=descriptor
                    )
                    logger.info(f"Created metric descriptor: {metric_config['type']}")
                except Exception as e:
                    # Metric already exists, ignore
                    pass
                    
            except Exception as e:
                logger.warning(f"Error creating metric descriptor: {e}")
    
    def write_profit_rate(self, profit_per_minute: float, chain: str = "all"):
        """Write profit rate metric"""
        self._write_metric(
            "custom.googleapis.com/arbitrage/profit_rate",
            profit_per_minute,
            {"chain": chain, "service": self.service_name}
        )
    
    def write_execution_latency(self, latency_ms: float, chain: str = "all"):
        """Write execution latency metric"""
        self._write_metric(
            "custom.googleapis.com/arbitrage/execution_latency",
            latency_ms,
            {"chain": chain, "service": self.service_name}
        )
    
    def write_success_rate(self, success_rate_pct: float, chain: str = "all"):
        """Write success rate metric"""
        self._write_metric(
            "custom.googleapis.com/arbitrage/success_rate",
            success_rate_pct,
            {"chain": chain, "service": self.service_name}
        )
    
    def write_opportunities_found(self, count: int, chain: str = "all"):
        """Write opportunities found metric (cumulative)"""
        self._write_metric(
            "custom.googleapis.com/arbitrage/opportunities_found",
            count,
            {"chain": chain, "service": self.service_name},
            metric_kind=monitoring_v3.MetricDescriptor.MetricKind.CUMULATIVE
        )
    
    def write_total_profit(self, total_usd: float, chain: str = "all"):
        """Write total profit metric (cumulative)"""
        self._write_metric(
            "custom.googleapis.com/arbitrage/total_profit",
            total_usd,
            {"chain": chain, "service": self.service_name},
            metric_kind=monitoring_v3.MetricDescriptor.MetricKind.CUMULATIVE
        )
    
    def _write_metric(
        self, 
        metric_type: str, 
        value: float, 
        labels: Dict[str, str],
        metric_kind = monitoring_v3.MetricDescriptor.MetricKind.GAUGE
    ):
        """Write a metric value to Cloud Monitoring"""
        
        try:
            series = monitoring_v3.TimeSeries()
            series.metric.type = metric_type
            series.resource.type = "global"
            
            # Add labels
            for key, val in labels.items():
                series.metric.labels[key] = val
            
            # Create data point
            now = time.time()
            seconds = int(now)
            nanos = int((now - seconds) * 10 ** 9)
            interval = monitoring_v3.TimeInterval(
                {"end_time": {"seconds": seconds, "nanos": nanos}}
            )
            
            point = monitoring_v3.Point({
                "interval": interval,
                "value": {"double_value": float(value)} if isinstance(value, float) else {"int64_value": int(value)}
            })
            
            series.points = [point]
            
            # Write to Cloud Monitoring
            self.client.create_time_series(
                name=self.project_name,
                time_series=[series]
            )
            
            logger.debug(f"Wrote metric {metric_type}: {value}")
            
        except Exception as e:
            logger.error(f"Error writing metric {metric_type}: {e}")
    
    def write_batch_metrics(self, metrics: Dict[str, Any]):
        """Write multiple metrics at once"""
        
        if "profit_rate" in metrics:
            self.write_profit_rate(metrics["profit_rate"])
        
        if "execution_latency" in metrics:
            self.write_execution_latency(metrics["execution_latency"])
        
        if "success_rate" in metrics:
            self.write_success_rate(metrics["success_rate"])
        
        if "opportunities_found" in metrics:
            self.write_opportunities_found(metrics["opportunities_found"])
        
        if "total_profit" in metrics:
            self.write_total_profit(metrics["total_profit"])
