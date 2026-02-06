import math
from decimal import Decimal
from typing import Dict, List

class CapitalEfficiencyEngine:
    """
    Phase 4.2: Capital Efficiency
    Implements Kelly Criterion and position sizing algorithms for optimal capital deployment.
    """
    
    def __init__(self, total_capital: Decimal):
        self.total_capital = total_capital
        self.max_position_size_percent = Decimal("0.20") # Max 20% per trade
        self.reinvestment_rate = Decimal("0.50") # Reinvest 50% of profits

    def calculate_kelly_criterion(self, win_rate: float, win_loss_ratio: float) -> float:
        """
        Calculate optimal fraction of capital to bet using Kelly Criterion.
        f = (bp - q) / b
        b = odds received (win_loss_ratio)
        p = probability of winning (win_rate)
        q = probability of losing (1 - p)
        """
        if win_loss_ratio == 0:
            return 0.0
            
        p = win_rate
        q = 1.0 - p
        b = win_loss_ratio
        
        f = (b * p - q) / b
        return max(0.0, f) # No negative bets

    def get_optimal_position_size(self, opportunity: Dict) -> Decimal:
        """
        Determine position size based on Kelly Criterion and risk limits.
        """
        win_rate = opportunity.get('historical_win_rate', 0.6)
        avg_win = opportunity.get('avg_win', 100)
        avg_loss = opportunity.get('avg_loss', 50)
        
        if avg_loss == 0:
            win_loss_ratio = 10.0 # Cap ratio if no losses
        else:
            win_loss_ratio = avg_win / avg_loss
            
        kelly_fraction = self.calculate_kelly_criterion(win_rate, win_loss_ratio)
        
        # Apply fractional Kelly for safety (e.g. Half Kelly) to reduce volatility
        safe_fraction = Decimal(str(kelly_fraction)) * Decimal("0.5")
        
        # Cap at max position size
        final_fraction = min(safe_fraction, self.max_position_size_percent)
        
        position_size = self.total_capital * final_fraction
        return position_size

    def allocate_capital(self, strategies: List[str]) -> Dict[str, Decimal]:
        """
        Allocate capital across multiple strategies.
        """
        allocations = {}
        # Simple equal weight for now, can be enhanced with risk-parity
        if not strategies:
            return allocations
            
        per_strategy = self.total_capital / len(strategies)
        for strategy in strategies:
            allocations[strategy] = per_strategy
            
        return allocations

    def process_reinvestment(self, profit: Decimal):
        """
        Handle profit reinvestment to compound growth.
        """
        reinvest_amount = profit * self.reinvestment_rate
        self.total_capital += reinvest_amount
        return reinvest_amount