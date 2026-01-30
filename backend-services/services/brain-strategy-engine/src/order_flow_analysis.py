"""
Order Flow Analysis Strategy
Analyzes real-time order book dynamics and market microstructure for trading signals
"""

import asyncio
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from decimal import Decimal
from scipy import stats
import logging
from collections import deque

logger = logging.getLogger(__name__)


@dataclass
class OrderFlowSignal:
    """Order flow analysis signal"""
    pair: str
    signal_type: str  # 'buy_imbalance', 'sell_imbalance', 'large_order', 'iceberg'
    strength: float  # 0-1 confidence score
    volume_imbalance: float  # Buy volume / (Buy + Sell volume)
    order_book_pressure: float  # Pressure indicator
    large_order_ratio: float  # Ratio of large orders to total
    iceberg_probability: float  # Probability of hidden orders
    holding_period_min: int
    expected_profit_pct: float
    timestamp: int


@dataclass
class OrderBookSnapshot:
    """Real-time order book snapshot"""
    bids: List[Tuple[float, float]]  # [(price, volume), ...]
    asks: List[Tuple[float, float]]  # [(price, volume), ...]
    timestamp: int
    exchange: str


class OrderFlowAnalysis:
    """
    Order Flow Analysis Strategy

    Analyzes:
    - Order book imbalances
    - Large order detection
    - Iceberg order patterns
    - Market maker activity
    - Order book pressure
    - Real-time microstructure signals
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config

        # Analysis parameters
        self.lookback_periods = 100  # Historical snapshots to analyze
        self.imbalance_threshold = 0.6  # 60% volume on one side
        self.large_order_threshold = 0.1  # 10% of best bid/ask volume
        self.iceberg_min_orders = 5  # Minimum orders for iceberg detection
        self.pressure_window = 10  # Rolling window for pressure calculation

        # Historical data
        self.order_book_history: Dict[str, deque] = {}
        self.volume_profiles: Dict[str, Dict] = {}

        # Signal thresholds
        self.min_signal_strength = 0.7
        self.max_holding_period = 30  # minutes

        logger.info("OrderFlowAnalysis initialized")

    async def analyze_order_flow(self, pair: str) -> List[OrderFlowSignal]:
        """
        Analyze order flow for a trading pair

        Args:
            pair: Trading pair (e.g., 'ETH/USDT')

        Returns:
            List of order flow signals
        """
        signals = []

        try:
            # Get recent order book snapshots
            snapshots = await self._get_recent_snapshots(pair)
            if len(snapshots) < 10:
                return signals

            # Calculate volume imbalance
            volume_imbalance = self._calculate_volume_imbalance(snapshots)

            # Detect large orders
            large_order_signals = self._detect_large_orders(snapshots)

            # Analyze iceberg patterns
            iceberg_signals = self._detect_iceberg_orders(snapshots)

            # Calculate order book pressure
            pressure = self._calculate_order_book_pressure(snapshots)

            # Generate signals based on analysis
            if volume_imbalance > self.imbalance_threshold:
                signal_type = 'buy_imbalance' if volume_imbalance > 0.5 else 'sell_imbalance'
                strength = min(abs(volume_imbalance - 0.5) * 2, 1.0)

                if strength > self.min_signal_strength:
                    signal = OrderFlowSignal(
                        pair=pair,
                        signal_type=signal_type,
                        strength=strength,
                        volume_imbalance=volume_imbalance,
                        order_book_pressure=pressure,
                        large_order_ratio=large_order_signals['ratio'],
                        iceberg_probability=iceberg_signals['probability'],
                        holding_period_min=int(self.max_holding_period * (1 - strength)),
                        expected_profit_pct=strength * 0.5,  # 0.5% max expected profit
                        timestamp=int(asyncio.get_event_loop().time())
                    )
                    signals.append(signal)

            # Add large order signals
            if large_order_signals['detected']:
                signal = OrderFlowSignal(
                    pair=pair,
                    signal_type='large_order',
                    strength=large_order_signals['strength'],
                    volume_imbalance=volume_imbalance,
                    order_book_pressure=pressure,
                    large_order_ratio=large_order_signals['ratio'],
                    iceberg_probability=iceberg_signals['probability'],
                    holding_period_min=5,  # Quick execution for large orders
                    expected_profit_pct=0.2,  # Conservative profit target
                    timestamp=int(asyncio.get_event_loop().time())
                )
                signals.append(signal)

            # Add iceberg signals
            if iceberg_signals['detected']:
                signal = OrderFlowSignal(
                    pair=pair,
                    signal_type='iceberg',
                    strength=iceberg_signals['strength'],
                    volume_imbalance=volume_imbalance,
                    order_book_pressure=pressure,
                    large_order_ratio=large_order_signals['ratio'],
                    iceberg_probability=iceberg_signals['probability'],
                    holding_period_min=15,  # Longer hold for iceberg patterns
                    expected_profit_pct=0.3,
                    timestamp=int(asyncio.get_event_loop().time())
                )
                signals.append(signal)

        except Exception as e:
            logger.error(f"Order flow analysis error for {pair}: {e}")

        return signals

    async def _get_recent_snapshots(self, pair: str) -> List[OrderBookSnapshot]:
        """Get recent order book snapshots for analysis"""
        # In production, this would fetch from market data service
        # For now, simulate realistic order book data

        if pair not in self.order_book_history:
            self.order_book_history[pair] = deque(maxlen=self.lookback_periods)

        # Generate simulated order book snapshots
        snapshots = []
        base_price = 3000.0 if 'ETH' in pair else 1.0  # ETH or stablecoin

        for i in range(self.lookback_periods):
            # Simulate realistic order book
            bids = []
            asks = []

            # Generate bid side (buy orders)
            for level in range(10):
                price = base_price * (1 - 0.001 * (level + 1))  # 0.1% spread
                volume = np.random.exponential(10)  # Random volume
                bids.append((price, volume))

            # Generate ask side (sell orders)
            for level in range(10):
                price = base_price * (1 + 0.001 * (level + 1))
                volume = np.random.exponential(10)
                asks.append((price, volume))

            snapshot = OrderBookSnapshot(
                bids=bids,
                asks=asks,
                timestamp=int(asyncio.get_event_loop().time()) - (self.lookback_periods - i) * 60,
                exchange='simulated'
            )
            snapshots.append(snapshot)

        # Update history
        for snapshot in snapshots[-10:]:  # Keep last 10
            self.order_book_history[pair].append(snapshot)

        return list(self.order_book_history[pair])

    def _calculate_volume_imbalance(self, snapshots: List[OrderBookSnapshot]) -> float:
        """Calculate buy/sell volume imbalance"""
        if not snapshots:
            return 0.5

        total_buy_volume = 0
        total_sell_volume = 0

        for snapshot in snapshots[-5:]:  # Use last 5 snapshots
            # Sum top 5 levels on each side
            buy_vol = sum(vol for _, vol in snapshot.bids[:5])
            sell_vol = sum(vol for _, vol in snapshot.asks[:5])

            total_buy_volume += buy_vol
            total_sell_volume += sell_vol

        total_volume = total_buy_volume + total_sell_volume
        if total_volume == 0:
            return 0.5

        return total_buy_volume / total_volume

    def _detect_large_orders(self, snapshots: List[OrderBookSnapshot]) -> Dict[str, Any]:
        """Detect large orders that may indicate institutional activity"""
        if not snapshots:
            return {'detected': False, 'ratio': 0, 'strength': 0}

        latest = snapshots[-1]

        # Calculate average volume at best bid/ask
        best_bid_vol = latest.bids[0][1] if latest.bids else 0
        best_ask_vol = latest.asks[0][1] if latest.asks else 0

        # Check for orders > threshold of best level
        large_buy_orders = [vol for _, vol in latest.bids if vol > best_bid_vol * self.large_order_threshold]
        large_sell_orders = [vol for _, vol in latest.asks if vol > best_ask_vol * self.large_order_threshold]

        total_large_volume = sum(large_buy_orders) + sum(large_sell_orders)
        total_volume = sum(vol for _, vol in latest.bids[:10] + latest.asks[:10])

        ratio = total_large_volume / total_volume if total_volume > 0 else 0

        return {
            'detected': ratio > 0.05,  # 5% of order book volume
            'ratio': ratio,
            'strength': min(ratio * 20, 1.0)  # Scale to 0-1
        }

    def _detect_iceberg_orders(self, snapshots: List[OrderBookSnapshot]) -> Dict[str, Any]:
        """Detect iceberg orders (hidden large orders)"""
        if len(snapshots) < self.iceberg_min_orders:
            return {'detected': False, 'probability': 0, 'strength': 0}

        # Analyze order size patterns
        recent = snapshots[-self.iceberg_min_orders:]

        # Check for consistent small orders at same price levels
        # This is a simplified iceberg detection

        bid_consistency = self._check_price_level_consistency([s.bids for s in recent])
        ask_consistency = self._check_price_level_consistency([s.asks for s in recent])

        consistency_score = max(bid_consistency, ask_consistency)

        # High consistency may indicate iceberg orders
        iceberg_prob = consistency_score

        return {
            'detected': iceberg_prob > 0.7,
            'probability': iceberg_prob,
            'strength': iceberg_prob
        }

    def _check_price_level_consistency(self, order_sides: List[List[Tuple[float, float]]]) -> float:
        """Check consistency of order sizes at price levels"""
        if not order_sides or len(order_sides) < 2:
            return 0

        # Get price levels from first snapshot
        price_levels = [price for price, _ in order_sides[0][:5]]

        consistency_scores = []

        for price in price_levels:
            volumes = []
            for side in order_sides:
                # Find volume at this price level
                for p, v in side[:5]:
                    if abs(p - price) / price < 0.001:  # Within 0.1%
                        volumes.append(v)
                        break
                else:
                    volumes.append(0)

            # Calculate coefficient of variation (lower = more consistent)
            if volumes and np.mean(volumes) > 0:
                cv = np.std(volumes) / np.mean(volumes)
                consistency = 1 / (1 + cv)  # Convert to 0-1 scale
                consistency_scores.append(consistency)

        return np.mean(consistency_scores) if consistency_scores else 0

    def _calculate_order_book_pressure(self, snapshots: List[OrderBookSnapshot]) -> float:
        """Calculate order book pressure indicator"""
        if len(snapshots) < self.pressure_window:
            return 0

        recent = snapshots[-self.pressure_window:]

        # Calculate pressure as ratio of bid volume to total volume
        pressures = []

        for snapshot in recent:
            bid_vol = sum(vol for _, vol in snapshot.bids[:5])
            ask_vol = sum(vol for _, vol in snapshot.asks[:5])
            total_vol = bid_vol + ask_vol

            if total_vol > 0:
                pressure = bid_vol / total_vol
                pressures.append(pressure)

        if not pressures:
            return 0.5

        # Return recent trend (positive = increasing buy pressure)
        if len(pressures) >= 2:
            return pressures[-1] - pressures[0]
        else:
            return pressures[0] - 0.5

    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get strategy performance metrics"""
        return {
            'analyzed_pairs': len(self.order_book_history),
            'total_snapshots': sum(len(history) for history in self.order_book_history.values()),
            'imbalance_threshold': self.imbalance_threshold,
            'large_order_threshold': self.large_order_threshold,
            'iceberg_detection_enabled': True,
            'min_signal_strength': self.min_signal_strength
        }
