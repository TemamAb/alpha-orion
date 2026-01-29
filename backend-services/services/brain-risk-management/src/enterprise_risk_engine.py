"""
Enterprise Risk Management Engine
Implements institutional-grade risk controls including VaR, stress testing, and circuit breakers
"""

import asyncio
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from decimal import Decimal
from datetime import datetime, timedelta
import logging
from scipy import stats
from collections import deque

logger = logging.getLogger(__name__)


@dataclass
class RiskMetrics:
    """Risk metrics for portfolio"""
    var_1day: Decimal
    var_10day: Decimal
    monte_carlo_var: Decimal
    confidence: float
    current_drawdown: Decimal
    max_drawdown: Decimal
    sharpe_ratio: float
    sortino_ratio: float
    timestamp: int


@dataclass
class StressTestResult:
    """Result of stress test scenario"""
    scenario_name: str
    pnl_impact: Decimal
    portfolio_value_after: Decimal
    drawdown: Decimal
    recovery_time_days: int
    probability: float


@dataclass
class PositionSize:
    """Optimal position size calculation"""
    size: Decimal
    kelly_size: Decimal
    volatility_adjusted: Decimal
    correlation_adjusted: Decimal
    final_size: Decimal
    reasoning: str


class EnterpriseRiskEngine:
    """Institutional-grade risk management engine"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        
        # Risk parameters
        self.var_confidence = 0.999  # 99.9% confidence
        self.var_time_horizons = [1, 10]  # 1-day and 10-day VaR
        self.update_frequency_ms = 1000  # Update every second
        
        # Circuit breaker thresholds
        self.max_drawdown = Decimal('0.05')  # 5% maximum drawdown
        self.max_daily_loss = Decimal('0.10')  # 10% maximum daily loss
        self.max_consecutive_losses = 5
        
        # Position limits
        self.max_position_size = Decimal('0.05')  # 5% of portfolio per position
        self.max_concentration = Decimal('0.20')  # 20% max in single asset
        
        # Historical data
        self.returns_history = deque(maxlen=252)  # 1 year of daily returns
        self.trades_history = deque(maxlen=1000)
        
        # State
        self.circuit_breaker_triggered = False
        self.last_var_calculation = None
        self.last_stress_test = None
        
        logger.info("EnterpriseRiskEngine initialized")
    
    async def calculate_var(
        self,
        portfolio: Dict[str, Any],
        method: str = 'historical_simulation'
    ) -> RiskMetrics:
        """
        Calculate Value-at-Risk using multiple methods
        
        Args:
            portfolio: Current portfolio state
            method: 'historical_simulation', 'parametric', or 'monte_carlo'
        
        Returns:
            RiskMetrics object with VaR calculations
        """
        try:
            if method == 'historical_simulation':
                var_1day, var_10day = await self._historical_var(portfolio)
            elif method == 'parametric':
                var_1day, var_10day = await self._parametric_var(portfolio)
            else:
                var_1day, var_10day = await self._monte_carlo_var(portfolio)
            
            # Calculate Monte Carlo VaR for comparison
            mc_var = await self._monte_carlo_var_single(portfolio, 10000)
            
            # Calculate drawdown metrics
            current_drawdown = await self._calculate_current_drawdown(portfolio)
            max_drawdown = await self._calculate_max_drawdown(portfolio)
            
            # Calculate risk-adjusted returns
            sharpe = await self._calculate_sharpe_ratio(portfolio)
            sortino = await self._calculate_sortino_ratio(portfolio)
            
            metrics = RiskMetrics(
                var_1day=var_1day,
                var_10day=var_10day,
                monte_carlo_var=mc_var,
                confidence=self.var_confidence,
                current_drawdown=current_drawdown,
                max_drawdown=max_drawdown,
                sharpe_ratio=sharpe,
                sortino_ratio=sortino,
                timestamp=int(datetime.now().timestamp())
            )
            
            self.last_var_calculation = metrics
            
            logger.info(
                f"VaR calculated: 1-day=${var_1day:.2f}, "
                f"10-day=${var_10day:.2f}, Sharpe={sharpe:.2f}"
            )
            
            return metrics
        
        except Exception as e:
            logger.error(f"Error calculating VaR: {e}")
            raise
    
    async def _historical_var(
        self,
        portfolio: Dict[str, Any]
    ) -> Tuple[Decimal, Decimal]:
        """Calculate VaR using historical simulation"""
        if len(self.returns_history) < 30:
            logger.warning("Insufficient historical data for VaR calculation")
            return Decimal('0'), Decimal('0')
        
        returns = np.array(list(self.returns_history))
        portfolio_value = Decimal(str(portfolio.get('total_value', 0)))
        
        # Sort returns
        sorted_returns = np.sort(returns)
        
        # Calculate VaR at confidence level
        var_index = int((1 - self.var_confidence) * len(sorted_returns))
        var_return_1day = sorted_returns[var_index]
        
        # 10-day VaR (assuming square root of time rule)
        var_return_10day = var_return_1day * np.sqrt(10)
        
        var_1day = abs(portfolio_value * Decimal(str(var_return_1day)))
        var_10day = abs(portfolio_value * Decimal(str(var_return_10day)))
        
        return var_1day, var_10day
    
    async def _parametric_var(
        self,
        portfolio: Dict[str, Any]
    ) -> Tuple[Decimal, Decimal]:
        """Calculate VaR using parametric method (variance-covariance)"""
        if len(self.returns_history) < 30:
            return Decimal('0'), Decimal('0')
        
        returns = np.array(list(self.returns_history))
        portfolio_value = Decimal(str(portfolio.get('total_value', 0)))
        
        # Calculate mean and standard deviation
        mean_return = np.mean(returns)
        std_return = np.std(returns)
        
        # Z-score for 99.9% confidence
        z_score = stats.norm.ppf(1 - self.var_confidence)
        
        # 1-day VaR
        var_return_1day = mean_return + z_score * std_return
        var_1day = abs(portfolio_value * Decimal(str(var_return_1day)))
        
        # 10-day VaR
        var_return_10day = mean_return * 10 + z_score * std_return * np.sqrt(10)
        var_10day = abs(portfolio_value * Decimal(str(var_return_10day)))
        
        return var_1day, var_10day
    
    async def _monte_carlo_var(
        self,
        portfolio: Dict[str, Any]
    ) -> Tuple[Decimal, Decimal]:
        """Calculate VaR using Monte Carlo simulation"""
        simulations = 10000
        
        if len(self.returns_history) < 30:
            return Decimal('0'), Decimal('0')
        
        returns = np.array(list(self.returns_history))
        portfolio_value = Decimal(str(portfolio.get('total_value', 0)))
        
        # Calculate parameters
        mean_return = np.mean(returns)
        std_return = np.std(returns)
        
        # Run simulations
        simulated_returns_1day = np.random.normal(mean_return, std_return, simulations)
        simulated_returns_10day = np.random.normal(
            mean_return * 10,
            std_return * np.sqrt(10),
            simulations
        )
        
        # Calculate VaR
        var_index = int((1 - self.var_confidence) * simulations)
        sorted_returns_1day = np.sort(simulated_returns_1day)
        sorted_returns_10day = np.sort(simulated_returns_10day)
        
        var_1day = abs(portfolio_value * Decimal(str(sorted_returns_1day[var_index])))
        var_10day = abs(portfolio_value * Decimal(str(sorted_returns_10day[var_index])))
        
        return var_1day, var_10day
    
    async def _monte_carlo_var_single(
        self,
        portfolio: Dict[str, Any],
        simulations: int
    ) -> Decimal:
        """Calculate single Monte Carlo VaR for comparison"""
        var_1day, _ = await self._monte_carlo_var(portfolio)
        return var_1day
    
    async def stress_test(
        self,
        portfolio: Dict[str, Any]
    ) -> List[StressTestResult]:
        """
        Run comprehensive stress tests on portfolio
        
        Returns:
            List of stress test results for different scenarios
        """
        scenarios = self._generate_stress_scenarios()
        
        results = []
        for scenario in scenarios:
            result = await self._run_stress_scenario(portfolio, scenario)
            results.append(result)
        
        # Sort by worst impact
        results.sort(key=lambda x: x.pnl_impact)
        
        self.last_stress_test = {
            'timestamp': datetime.now(),
            'results': results
        }
        
        worst_case = results[0]
        logger.info(
            f"Stress test complete: Worst case scenario '{worst_case.scenario_name}' "
            f"would result in ${worst_case.pnl_impact:.2f} loss"
        )
        
        return results
    
    def _generate_stress_scenarios(self) -> List[Dict[str, Any]]:
        """Generate stress test scenarios"""
        scenarios = [
            # Market crashes
            {'name': 'MARKET_CRASH_20', 'market_change': -0.20, 'probability': 0.01},
            {'name': 'MARKET_CRASH_50', 'market_change': -0.50, 'probability': 0.001},
            {'name': 'FLASH_CRASH', 'market_change': -0.30, 'duration_minutes': 5, 'probability': 0.005},
            
            # Gas price spikes
            {'name': 'GAS_SPIKE_5X', 'gas_multiplier': 5, 'probability': 0.10},
            {'name': 'GAS_SPIKE_10X', 'gas_multiplier': 10, 'probability': 0.05},
            {'name': 'GAS_SPIKE_50X', 'gas_multiplier': 50, 'probability': 0.01},
            
            # Liquidity crises
            {'name': 'LIQUIDITY_CRISIS_50', 'liquidity_reduction': 0.50, 'probability': 0.05},
            {'name': 'LIQUIDITY_CRISIS_80', 'liquidity_reduction': 0.80, 'probability': 0.01},
            
            # Infrastructure failures
            {'name': 'RPC_FAILURE', 'rpc_downtime_minutes': 30, 'probability': 0.02},
            {'name': 'DEX_FAILURE', 'dex_count_down': 3, 'probability': 0.05},
            {'name': 'BRIDGE_FAILURE', 'cross_chain_disabled': True, 'probability': 0.02},
            
            # Volatility spikes
            {'name': 'VOLATILITY_SPIKE_2X', 'volatility_multiplier': 2, 'probability': 0.10},
            {'name': 'VOLATILITY_SPIKE_5X', 'volatility_multiplier': 5, 'probability': 0.02},
            
            # Correlation breakdown
            {'name': 'CORRELATION_BREAKDOWN', 'correlation_change': 0.50, 'probability': 0.05},
            
            # Smart contract exploits
            {'name': 'SMART_CONTRACT_EXPLOIT', 'position_loss': 1.0, 'probability': 0.001},
            
            # Regulatory events
            {'name': 'REGULATORY_SHUTDOWN', 'trading_halt_days': 7, 'probability': 0.001},
        ]
        
        # Generate additional random scenarios
        for i in range(984):  # Total 1000 scenarios
            scenarios.append({
                'name': f'RANDOM_SCENARIO_{i}',
                'market_change': np.random.normal(-0.05, 0.10),
                'gas_multiplier': max(1, np.random.lognormal(0, 1)),
                'liquidity_reduction': max(0, min(1, np.random.beta(2, 5))),
                'probability': 0.001
            })
        
        return scenarios
    
    async def _run_stress_scenario(
        self,
        portfolio: Dict[str, Any],
        scenario: Dict[str, Any]
    ) -> StressTestResult:
        """Run a single stress test scenario"""
        portfolio_value = Decimal(str(portfolio.get('total_value', 0)))
        
        # Calculate impact based on scenario parameters
        pnl_impact = Decimal('0')
        
        if 'market_change' in scenario:
            pnl_impact += portfolio_value * Decimal(str(scenario['market_change']))
        
        if 'gas_multiplier' in scenario:
            # Assume 10% of portfolio value is at risk from gas costs
            gas_impact = portfolio_value * Decimal('0.10') * (Decimal(str(scenario['gas_multiplier'])) - 1)
            pnl_impact -= gas_impact
        
        if 'liquidity_reduction' in scenario:
            # Slippage impact
            slippage_impact = portfolio_value * Decimal(str(scenario['liquidity_reduction'])) * Decimal('0.05')
            pnl_impact -= slippage_impact
        
        if 'position_loss' in scenario:
            pnl_impact -= portfolio_value * Decimal(str(scenario['position_loss']))
        
        portfolio_value_after = portfolio_value + pnl_impact
        drawdown = abs(pnl_impact / portfolio_value) if portfolio_value > 0 else Decimal('0')
        
        # Estimate recovery time (simplified)
        recovery_days = int(abs(float(drawdown)) * 100) if drawdown > 0 else 0
        
        return StressTestResult(
            scenario_name=scenario['name'],
            pnl_impact=pnl_impact,
            portfolio_value_after=portfolio_value_after,
            drawdown=drawdown,
            recovery_time_days=recovery_days,
            probability=scenario.get('probability', 0.001)
        )
    
    async def check_circuit_breaker(
        self,
        portfolio: Dict[str, Any],
        trades: List[Dict[str, Any]]
    ) -> bool:
        """
        Check if circuit breaker should be triggered
        
        Returns:
            True if circuit breaker triggered, False otherwise
        """
        # Check drawdown
        current_drawdown = await self._calculate_current_drawdown(portfolio)
        if current_drawdown > self.max_drawdown:
            await self._trigger_circuit_breaker(
                'MAX_DRAWDOWN_EXCEEDED',
                float(current_drawdown)
            )
            return True
        
        # Check daily loss
        daily_loss = await self._calculate_daily_loss(trades)
        if daily_loss > self.max_daily_loss:
            await self._trigger_circuit_breaker(
                'MAX_DAILY_LOSS_EXCEEDED',
                float(daily_loss)
            )
            return True
        
        # Check consecutive losses
        consecutive_losses = self._count_consecutive_losses(trades)
        if consecutive_losses >= self.max_consecutive_losses:
            await self._trigger_circuit_breaker(
                'CONSECUTIVE_LOSSES_EXCEEDED',
                consecutive_losses
            )
            return True
        
        return False
    
    async def _trigger_circuit_breaker(self, reason: str, value: float):
        """Trigger circuit breaker and halt trading"""
        self.circuit_breaker_triggered = True
        
        logger.critical(
            f"🚨 CIRCUIT BREAKER TRIGGERED: {reason} (value: {value})"
        )
        
        # Alert team (would integrate with PagerDuty, Slack, etc.)
        await self._send_critical_alert({
            'type': 'CIRCUIT_BREAKER',
            'reason': reason,
            'value': value,
            'timestamp': datetime.now().isoformat()
        })
    
    async def _send_critical_alert(self, alert: Dict[str, Any]):
        """Send critical alert to monitoring systems"""
        # Placeholder - would integrate with actual alerting systems
        logger.critical(f"CRITICAL ALERT: {alert}")
    
    async def calculate_optimal_position_size(
        self,
        opportunity: Dict[str, Any],
        portfolio: Dict[str, Any]
    ) -> PositionSize:
        """
        Calculate optimal position size using Kelly Criterion and risk adjustments
        
        Args:
            opportunity: Trading opportunity details
            portfolio: Current portfolio state
        
        Returns:
            PositionSize object with optimal size and reasoning
        """
        # Kelly Criterion: f* = (bp - q) / b
        # where b = odds, p = win probability, q = loss probability
        win_prob = opportunity.get('confidence', 0.75)
        loss_prob = 1 - win_prob
        
        expected_return = opportunity.get('expected_profit', 0)
        risk = opportunity.get('max_loss', expected_return * 0.5)
        
        if risk == 0:
            kelly_size = Decimal('0')
        else:
            odds = abs(expected_return / risk)
            kelly_fraction = (odds * win_prob - loss_prob) / odds
            kelly_size = max(Decimal('0'), Decimal(str(kelly_fraction)))
        
        # Half-Kelly for safety
        kelly_size = kelly_size * Decimal('0.5')
        
        # Adjust for volatility
        volatility = await self._get_asset_volatility(opportunity.get('asset', 'ETH'))
        volatility_adjustment = Decimal('1') / (Decimal('1') + volatility)
        volatility_adjusted = kelly_size * volatility_adjustment
        
        # Adjust for correlation
        correlation = await self._get_portfolio_correlation(
            opportunity.get('asset', 'ETH'),
            portfolio
        )
        correlation_adjustment = Decimal('1') - abs(correlation)
        correlation_adjusted = volatility_adjusted * correlation_adjustment
        
        # Apply maximum position limit
        final_size = min(correlation_adjusted, self.max_position_size)
        
        reasoning = (
            f"Kelly: {kelly_size:.4f}, "
            f"Volatility adj: {volatility_adjusted:.4f}, "
            f"Correlation adj: {correlation_adjusted:.4f}, "
            f"Final (capped): {final_size:.4f}"
        )
        
        return PositionSize(
            size=final_size,
            kelly_size=kelly_size,
            volatility_adjusted=volatility_adjusted,
            correlation_adjusted=correlation_adjusted,
            final_size=final_size,
            reasoning=reasoning
        )
    
    async def _calculate_current_drawdown(
        self,
        portfolio: Dict[str, Any]
    ) -> Decimal:
        """Calculate current drawdown from peak"""
        current_value = Decimal(str(portfolio.get('total_value', 0)))
        peak_value = Decimal(str(portfolio.get('peak_value', current_value)))
        
        if peak_value == 0:
            return Decimal('0')
        
        drawdown = (peak_value - current_value) / peak_value
        return max(Decimal('0'), drawdown)
    
    async def _calculate_max_drawdown(
        self,
        portfolio: Dict[str, Any]
    ) -> Decimal:
        """Calculate maximum drawdown in history"""
        # Placeholder - would calculate from historical equity curve
        return Decimal('0.03')  # 3% historical max drawdown
    
    async def _calculate_daily_loss(
        self,
        trades: List[Dict[str, Any]]
    ) -> Decimal:
        """Calculate total loss for current day"""
        today = datetime.now().date()
        
        daily_pnl = Decimal('0')
        for trade in trades:
            trade_date = datetime.fromtimestamp(trade.get('timestamp', 0)).date()
            if trade_date == today:
                daily_pnl += Decimal(str(trade.get('pnl', 0)))
        
        # Return loss as positive number
        return abs(min(Decimal('0'), daily_pnl))
    
    def _count_consecutive_losses(self, trades: List[Dict[str, Any]]) -> int:
        """Count consecutive losing trades"""
        if not trades:
            return 0
        
        consecutive = 0
        for trade in reversed(trades):
            if trade.get('pnl', 0) < 0:
                consecutive += 1
            else:
                break
        
        return consecutive
    
    async def _calculate_sharpe_ratio(
        self,
        portfolio: Dict[str, Any],
        risk_free_rate: float = 0.04
    ) -> float:
        """Calculate Sharpe ratio"""
        if len(self.returns_history) < 30:
            return 0.0
        
        returns = np.array(list(self.returns_history))
        excess_returns = returns - (risk_free_rate / 252)  # Daily risk-free rate
        
        if np.std(excess_returns) == 0:
            return 0.0
        
        sharpe = np.mean(excess_returns) / np.std(excess_returns) * np.sqrt(252)
        return float(sharpe)
    
    async def _calculate_sortino_ratio(
        self,
        portfolio: Dict[str, Any],
        risk_free_rate: float = 0.04
    ) -> float:
        """Calculate Sortino ratio (downside deviation)"""
        if len(self.returns_history) < 30:
            return 0.0
        
        returns = np.array(list(self.returns_history))
        excess_returns = returns - (risk_free_rate / 252)
        
        # Downside deviation (only negative returns)
        downside_returns = excess_returns[excess_returns < 0]
        
        if len(downside_returns) == 0 or np.std(downside_returns) == 0:
            return 0.0
        
        sortino = np.mean(excess_returns) / np.std(downside_returns) * np.sqrt(252)
        return float(sortino)
    
    async def _get_asset_volatility(self, asset: str) -> Decimal:
        """Get asset volatility"""
        # Placeholder - would fetch from price oracle
        return Decimal('0.50')  # 50% annualized volatility
    
    async def _get_portfolio_correlation(
        self,
        asset: str,
        portfolio: Dict[str, Any]
    ) -> Decimal:
        """Get correlation between asset and portfolio"""
        # Placeholder - would calculate from historical data
        return Decimal('0.30')  # 30% correlation
    
    def add_return(self, return_value: float):
        """Add return to historical data"""
        self.returns_history.append(return_value)
    
    def add_trade(self, trade: Dict[str, Any]):
        """Add trade to historical data"""
        self.trades_history.append(trade)
    
    def reset_circuit_breaker(self):
        """Reset circuit breaker (manual override)"""
        self.circuit_breaker_triggered = False
        logger.warning("Circuit breaker manually reset")
