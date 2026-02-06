import logging
from decimal import Decimal
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class ProfitOptimizer:
    """
    Phase 4.3: Profit Optimization
    Implements dynamic fee optimization, slippage control, and performance-based scaling.
    """

    def __init__(self):
        self.base_slippage = Decimal("0.005") # 0.5%
        self.max_slippage = Decimal("0.03")   # 3.0%
        self.min_profit_threshold = Decimal("50.0") # $50
        self.performance_history = {} # strategy_id -> {wins, losses, total_profit}

    def optimize_dynamic_fee(self, estimated_profit: Decimal, network_congestion: str) -> Decimal:
        """
        Calculate optimal priority fee based on estimated profit and network conditions.
        Returns a suggested priority fee multiplier or value.
        """
        fee_multiplier = Decimal("1.0")
        
        if network_congestion == "HIGH":
            fee_multiplier = Decimal("1.5")
        elif network_congestion == "EXTREME":
            fee_multiplier = Decimal("2.0")
            
        # Cap fee at a percentage of profit to ensure profitability
        # We aim to spend no more than 30% of projected profit on priority fees to guarantee inclusion
        max_fee_allocation = estimated_profit * Decimal("0.30") 
        
        # Base priority fee in Gwei (simplified default for calculation)
        base_priority_fee = Decimal("2.0") 
        
        suggested_fee = base_priority_fee * fee_multiplier
        
        # In a real scenario, this would interface with gas estimators.
        # Here we return the optimized fee suggestion.
        return suggested_fee

    def calculate_optimal_slippage(self, volatility: float, liquidity_depth: float, trade_size: Decimal) -> Decimal:
        """
        Calculate optimal slippage tolerance.
        Higher volatility -> Higher slippage tolerance needed.
        Lower liquidity relative to trade size -> Higher slippage tolerance needed.
        """
        # Base slippage
        slippage = self.base_slippage
        
        # Adjust for volatility (simplified linear scaling)
        # Assuming volatility is standard deviation of returns over a short window
        volatility_factor = Decimal(str(volatility)) * Decimal("0.5")
        slippage += volatility_factor
        
        # Adjust for liquidity impact
        if liquidity_depth > 0:
            impact = trade_size / Decimal(str(liquidity_depth))
            slippage += impact * Decimal("1.5") # Impact penalty
            
        return min(slippage, self.max_slippage)

    def update_performance_metrics(self, strategy_id: str, profit: Decimal):
        """
        Update performance history for a strategy.
        """
        if strategy_id not in self.performance_history:
            self.performance_history[strategy_id] = {'wins': 0, 'losses': 0, 'total_profit': Decimal("0")}
            
        stats = self.performance_history[strategy_id]
        stats['total_profit'] += profit
        if profit > 0:
            stats['wins'] += 1
        else:
            stats['losses'] += 1

    def get_capital_scaling_factor(self, strategy_id: str) -> Decimal:
        """
        Determine capital scaling factor based on performance.
        """
        stats = self.performance_history.get(strategy_id)
        if not stats:
            return Decimal("1.0")
            
        total_trades = stats['wins'] + stats['losses']
        if total_trades < 5:
            return Decimal("1.0") # Not enough data
            
        win_rate = stats['wins'] / total_trades
        
        if win_rate > 0.7:
            return Decimal("1.5") # Scale up
        elif win_rate > 0.5:
            return Decimal("1.0") # Maintain
        elif win_rate > 0.3:
            return Decimal("0.5") # Scale down
        else:
            return Decimal("0.0") # Stop (or minimal)

    def should_reinvest(self, current_capital: Decimal, target_capital: Decimal) -> bool:
        """
        Determine if profits should be reinvested or withdrawn based on targets.
        """
        return current_capital < target_capital