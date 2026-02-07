"""
ALPHA-08 PROFIT TRACKING ENGINE
Real-time profit monitoring with manual withdrawal mode
"""
import time
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ProfitTracker")

@dataclass
class ProfitRecord:
    timestamp: str
    strategy: str
    trade_id: str
    profit_usd: float
    gas_cost_usd: float
    net_profit_usd: float
    tx_hash: Optional[str] = None
    block_number: Optional[int] = None

class ProfitTracker:
    """
    Enterprise-grade profit tracking system with manual withdrawal mode.
    Tracks all profits in real-time and maintains cumulative totals.
    
    WALLET PRIORITY HIERARCHY:
    1. Executive Deck (highest priority) - Set from executive-deck.html
    2. Gemini Dashboard - Set from gemini-alpha-dashboard.html
    3. GCP Environment (lowest priority) - Set from Terraform/GCP secrets
    """
    
    WALLET_SOURCES = {
        'executive_deck': 3,
        'gemini_dashboard': 2,
        'gcp_secret': 1,
        'environment': 1
    }
    
    def __init__(self, data_dir: str = "./data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

        
        self.profit_file = self.data_dir / "profit_records.json"
        self.cumulative_file = self.data_dir / "cumulative_profit.json"
        
        # Initialize state
        self.current_session_profit = 0.0
        self.cumulative_profit = self._load_cumulative_profit()
        self.withdrawal_mode = "MANUAL"  # Default to manual mode
        self.withdrawal_threshold = 1000.0  # USD
        self.target_wallet = None
        self.wallet_source = None  # Track where wallet was set from
        
        logger.info(f"✅ Profit Tracker initialized | Mode: {self.withdrawal_mode}")
        logger.info(f"📊 Cumulative Profit: ${self.cumulative_profit:,.2f}")
    
    def _load_cumulative_profit(self) -> float:
        """Load cumulative profit from disk"""
        if self.cumulative_file.exists():
            try:
                with open(self.cumulative_file, 'r') as f:
                    data = json.load(f)
                    return data.get('total_profit_usd', 0.0)
            except Exception as e:
                logger.error(f"Error loading cumulative profit: {e}")
                return 0.0
        return 0.0
    
    def _save_cumulative_profit(self):
        """Save cumulative profit to disk"""
        data = {
            'total_profit_usd': self.cumulative_profit,
            'last_updated': datetime.now().isoformat(),
            'withdrawal_mode': self.withdrawal_mode,
            'session_profit': self.current_session_profit
        }
        with open(self.cumulative_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def record_profit(self, strategy: str, profit_usd: float, gas_cost_usd: float, 
                     tx_hash: Optional[str] = None, block_number: Optional[int] = None) -> ProfitRecord:
        """
        Record a new profit event
        
        Args:
            strategy: Name of the strategy that generated profit
            profit_usd: Gross profit in USD
            gas_cost_usd: Gas cost in USD
            tx_hash: Transaction hash (if available)
            block_number: Block number (if available)
        
        Returns:
            ProfitRecord object
        """
        net_profit = profit_usd - gas_cost_usd
        
        record = ProfitRecord(
            timestamp=datetime.now().isoformat(),
            strategy=strategy,
            trade_id=f"TRADE_{int(time.time() * 1000)}",
            profit_usd=profit_usd,
            gas_cost_usd=gas_cost_usd,
            net_profit_usd=net_profit,
            tx_hash=tx_hash,
            block_number=block_number
        )
        
        # Update totals
        self.current_session_profit += net_profit
        self.cumulative_profit += net_profit
        
        # Save to disk
        self._save_profit_record(record)
        self._save_cumulative_profit()
        
        logger.info(f"💰 Profit Recorded: ${net_profit:.2f} | Strategy: {strategy} | Cumulative: ${self.cumulative_profit:,.2f}")
        
        return record
    
    def _save_profit_record(self, record: ProfitRecord):
        """Append profit record to file"""
        records = []
        if self.profit_file.exists():
            with open(self.profit_file, 'r') as f:
                records = json.load(f)
        
        records.append(asdict(record))
        
        with open(self.profit_file, 'w') as f:
            json.dump(records, f, indent=2)
    
    def get_current_profit(self) -> Dict:
        """Get current profit statistics"""
        return {
            'session_profit_usd': round(self.current_session_profit, 2),
            'cumulative_profit_usd': round(self.cumulative_profit, 2),
            'withdrawal_mode': self.withdrawal_mode,
            'withdrawal_threshold_usd': self.withdrawal_threshold,
            'withdrawable_balance': round(self.cumulative_profit, 2),
            'target_wallet': self.target_wallet or "NOT_SET",
            'wallet_source': self.wallet_source or "none",
            'wallet_priority': self.WALLET_SOURCES.get(self.wallet_source, 0) if self.wallet_source else 0,
            'last_updated': datetime.now().isoformat()
        }
    
    def get_profit_breakdown(self, hours: int = 24) -> Dict:
        """Get profit breakdown for the last N hours"""
        if not self.profit_file.exists():
            return {
                'total_trades': 0,
                'total_profit_usd': 0.0,
                'avg_profit_per_trade': 0.0,
                'strategies': {}
            }
        
        with open(self.profit_file, 'r') as f:
            records = json.load(f)
        
        # Filter by time window
        cutoff_time = datetime.now().timestamp() - (hours * 3600)
        recent_records = [
            r for r in records 
            if datetime.fromisoformat(r['timestamp']).timestamp() > cutoff_time
        ]
        
        # Calculate statistics
        total_profit = sum(r['net_profit_usd'] for r in recent_records)
        strategy_breakdown = {}
        
        for record in recent_records:
            strategy = record['strategy']
            if strategy not in strategy_breakdown:
                strategy_breakdown[strategy] = {
                    'trades': 0,
                    'profit_usd': 0.0
                }
            strategy_breakdown[strategy]['trades'] += 1
            strategy_breakdown[strategy]['profit_usd'] += record['net_profit_usd']
        
        return {
            'time_window_hours': hours,
            'total_trades': len(recent_records),
            'total_profit_usd': round(total_profit, 2),
            'avg_profit_per_trade': round(total_profit / len(recent_records), 2) if recent_records else 0.0,
            'strategies': strategy_breakdown
        }
    
    def set_withdrawal_mode(self, mode: str):
        """Set withdrawal mode (MANUAL or AUTO)"""
        if mode.upper() not in ['MANUAL', 'AUTO']:
            raise ValueError("Mode must be 'MANUAL' or 'AUTO'")
        
        self.withdrawal_mode = mode.upper()
        self._save_cumulative_profit()
        logger.info(f"🔧 Withdrawal mode set to: {self.withdrawal_mode}")
    
    def set_target_wallet(self, wallet_address: str, source: str = 'gemini_dashboard'):
        """
        Set target wallet for withdrawals with priority override.
        
        Priority (highest to lowest):
        1. Executive Deck (source='executive_deck')
        2. Gemini Dashboard (source='gemini_dashboard')
        3. GCP Secret (source='gcp_secret')
        """
        new_priority = self.WALLET_SOURCES.get(source, 1)
        current_priority = self.WALLET_SOURCES.get(self.wallet_source, 0) if self.wallet_source else 0
        
        # Only update if new source has higher or equal priority
        if new_priority >= current_priority:
            old_wallet = self.target_wallet
            self.target_wallet = wallet_address
            self.wallet_source = source
            self._save_cumulative_profit()
            logger.info(f"🔧 Target wallet updated: {wallet_address} (source: {source}, priority: {new_priority})")
            logger.info(f"   [OVERRIDE] Previously: {old_wallet[:10]}... if any")
        else:
            logger.warning(f"⚠️ Wallet from {source} rejected (lower priority than {self.wallet_source})")
            logger.info(f"   Keeping current wallet: {self.target_wallet[:10]}... from {self.wallet_source}")
    
    def request_withdrawal(self, amount_usd: float, wallet_address: str) -> Dict:
        """
        Request a manual withdrawal
        
        Args:
            amount_usd: Amount to withdraw in USD
            wallet_address: Target wallet address
        
        Returns:
            Withdrawal request details
        """
        if amount_usd > self.cumulative_profit:
            return {
                'status': 'ERROR',
                'message': f'Insufficient balance. Available: ${self.cumulative_profit:.2f}'
            }
        
        withdrawal_request = {
            'request_id': f"WD_{int(time.time() * 1000)}",
            'timestamp': datetime.now().isoformat(),
            'amount_usd': amount_usd,
            'wallet_address': wallet_address,
            'status': 'PENDING_APPROVAL',
            'mode': self.withdrawal_mode
        }
        
        logger.info(f"💸 Withdrawal Requested: ${amount_usd:.2f} to {wallet_address}")
        
        return withdrawal_request

if __name__ == "__main__":
    # Test the profit tracker
    tracker = ProfitTracker()
    
    # Simulate some profits
    tracker.record_profit("Vulture Liquidation", 125.50, 5.20, tx_hash="0xabc123")
    tracker.record_profit("Triangular Arb V9", 87.30, 3.10)
    tracker.record_profit("Flash Loan Arb", 245.80, 8.50, tx_hash="0xdef456")
    
    # Get current stats
    print("\n📊 Current Profit Stats:")
    print(json.dumps(tracker.get_current_profit(), indent=2))
    
    print("\n📈 24h Breakdown:")
    print(json.dumps(tracker.get_profit_breakdown(24), indent=2))
