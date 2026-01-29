"""
Enterprise Orchestrator
Integrates all enterprise components: multi-chain engine, risk management, execution, and strategies
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
from decimal import Decimal
from datetime import datetime
import json

# Import enterprise components
from multi_chain_engine import MultiChainEngine
from enterprise_risk_engine import EnterpriseRiskEngine
from enterprise_execution_engine import EnterpriseExecutionEngine
from cross_exchange_arbitrage import CrossExchangeArbitrage

logger = logging.getLogger(__name__)


class EnterpriseOrchestrator:
    """
    Main orchestrator for Alpha-Orion enterprise platform
    
    Integrates:
    - Multi-chain arbitrage engine
    - Enterprise risk management
    - High-performance execution
    - Advanced arbitrage strategies
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        
        # Initialize components
        self.multi_chain_engine = MultiChainEngine(config)
        self.risk_engine = EnterpriseRiskEngine(config)
        self.execution_engine = EnterpriseExecutionEngine(config)
        self.cross_exchange_strategy = CrossExchangeArbitrage(config)
        
        # State
        self.running = False
        self.portfolio = {
            'total_value': Decimal('100000'),  # $100K starting capital
            'peak_value': Decimal('100000'),
            'positions': {},
            'trades': [],
            'pnl': Decimal('0')
        }
        
        # Performance tracking
        self.total_trades = 0
        self.successful_trades = 0
        self.total_profit = Decimal('0')
        self.start_time = None
        
        logger.info("EnterpriseOrchestrator initialized")
    
    async def initialize(self):
        """Initialize all components"""
        logger.info("Initializing enterprise components...")
        
        await asyncio.gather(
            self.multi_chain_engine.initialize(),
            self.execution_engine.initialize(),
            self.cross_exchange_strategy.initialize()
        )
        
        logger.info("All components initialized successfully")
    
    async def start(self):
        """Start the orchestrator"""
        self.running = True
        self.start_time = datetime.now()
        
        logger.info("🚀 Alpha-Orion Enterprise Platform Starting...")
        logger.info(f"Starting capital: ${self.portfolio['total_value']:,.2f}")
        
        # Start main loop
        await self.main_loop()
    
    async def main_loop(self):
        """Main orchestration loop"""
        
        while self.running:
            try:
                # Step 1: Check circuit breakers
                if await self._check_circuit_breakers():
                    logger.critical("Circuit breaker triggered - halting trading")
                    break
                
                # Step 2: Scan for opportunities (parallel across all strategies)
                opportunities = await self._scan_opportunities()
                
                if not opportunities:
                    logger.info("No opportunities found, waiting...")
                    await asyncio.sleep(30)  # Wait 30 seconds
                    continue
                
                # Step 3: Risk assessment for each opportunity
                filtered_opportunities = await self._assess_opportunities(opportunities)
                
                if not filtered_opportunities:
                    logger.info("All opportunities filtered by risk management")
                    await asyncio.sleep(30)
                    continue
                
                # Step 4: Execute best opportunity
                best_opportunity = filtered_opportunities[0]
                await self._execute_opportunity(best_opportunity)
                
                # Step 5: Update portfolio and metrics
                await self._update_portfolio()
                
                # Step 6: Log performance
                await self._log_performance()
                
                # Wait before next scan
                await asyncio.sleep(10)  # 10 second scan interval
            
            except Exception as e:
                logger.error(f"Error in main loop: {e}", exc_info=True)
                await asyncio.sleep(30)
    
    async def _check_circuit_breakers(self) -> bool:
        """Check if circuit breakers should trigger"""
        try:
            triggered = await self.risk_engine.check_circuit_breaker(
                self.portfolio,
                self.portfolio['trades']
            )
            
            if triggered:
                await self._handle_circuit_breaker()
            
            return triggered
        
        except Exception as e:
            logger.error(f"Circuit breaker check error: {e}")
            return False
    
    async def _scan_opportunities(self) -> List[Dict[str, Any]]:
        """Scan all strategies for opportunities"""
        logger.info("Scanning for opportunities...")
        
        # Scan all strategies in parallel
        tasks = [
            self.multi_chain_engine.scan_all_chains(),
            self.cross_exchange_strategy.scan_opportunities()
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Combine opportunities
        all_opportunities = []
        for result in results:
            if isinstance(result, list):
                all_opportunities.extend(result)
            elif isinstance(result, Exception):
                logger.error(f"Strategy scan error: {result}")
        
        # Convert to standard format
        opportunities = []
        for opp in all_opportunities:
            opportunities.append({
                'strategy': getattr(opp, 'strategy', 'UNKNOWN'),
                'chain': getattr(opp, 'chain', 'ethereum'),
                'token_in': getattr(opp, 'token_in', 'USDC'),
                'token_out': getattr(opp, 'token_out', 'USDT'),
                'amount_in': getattr(opp, 'amount', Decimal('1000')),
                'expected_profit': getattr(opp, 'expected_profit', Decimal('0')),
                'gas_cost': getattr(opp, 'gas_cost', Decimal('50')),
                'net_profit': getattr(opp, 'net_profit', Decimal('0')),
                'confidence': getattr(opp, 'confidence', 0.75),
                'execution_path': getattr(opp, 'execution_path', []),
                'timestamp': getattr(opp, 'timestamp', int(datetime.now().timestamp()))
            })
        
        logger.info(f"Found {len(opportunities)} total opportunities")
        
        return opportunities
    
    async def _assess_opportunities(
        self,
        opportunities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Assess opportunities with risk management"""
        
        filtered = []
        
        for opp in opportunities:
            # Calculate VaR for this opportunity
            var_metrics = await self.risk_engine.calculate_var(self.portfolio)
            
            # Calculate optimal position size
            position_size = await self.risk_engine.calculate_optimal_position_size(
                opp,
                self.portfolio
            )
            
            # Check if opportunity meets risk criteria
            if self._meets_risk_criteria(opp, position_size, var_metrics):
                opp['position_size'] = position_size
                opp['var_metrics'] = var_metrics
                filtered.append(opp)
                
                logger.info(
                    f"Opportunity approved: {opp['strategy']} on {opp['chain']}, "
                    f"net profit: ${opp['net_profit']:.2f}, "
                    f"position size: {position_size.final_size:.4f}"
                )
            else:
                logger.debug(
                    f"Opportunity filtered: {opp['strategy']}, "
                    f"failed risk criteria"
                )
        
        # Sort by net profit
        filtered.sort(key=lambda x: x['net_profit'], reverse=True)
        
        return filtered
    
    def _meets_risk_criteria(
        self,
        opportunity: Dict[str, Any],
        position_size: Any,
        var_metrics: Any
    ) -> bool:
        """Check if opportunity meets risk criteria"""
        
        # Minimum profit requirement
        if opportunity['net_profit'] < Decimal('100'):
            return False
        
        # Confidence requirement
        if opportunity['confidence'] < 0.70:
            return False
        
        # Position size must be positive
        if position_size.final_size <= 0:
            return False
        
        # Profit must be > 2x gas cost
        if opportunity['net_profit'] < opportunity['gas_cost'] * 2:
            return False
        
        return True
    
    async def _execute_opportunity(self, opportunity: Dict[str, Any]):
        """Execute an arbitrage opportunity"""
        
        logger.info(
            f"🎯 Executing {opportunity['strategy']} on {opportunity['chain']}: "
            f"Expected profit ${opportunity['net_profit']:.2f}"
        )
        
        try:
            # Get Web3 instance for the chain
            w3 = self.multi_chain_engine.web3_instances.get(opportunity['chain'])
            if not w3:
                logger.error(f"No Web3 instance for {opportunity['chain']}")
                return
            
            # Get account (would load from secure storage in production)
            from eth_account import Account
            private_key = self.config.get('PRIVATE_KEY')
            if not private_key:
                logger.error("No private key configured")
                return
            
            account = Account.from_key(private_key)
            
            # Execute via execution engine
            result = await self.execution_engine.execute_arbitrage(
                opportunity,
                w3,
                account
            )
            
            # Record trade
            trade = {
                'timestamp': datetime.now().timestamp(),
                'strategy': opportunity['strategy'],
                'chain': opportunity['chain'],
                'success': result.success,
                'tx_hash': result.tx_hash,
                'execution_time_ms': result.execution_time_ms,
                'expected_profit': float(opportunity['net_profit']),
                'actual_profit': float(result.profit) if result.profit else 0,
                'gas_cost': float(opportunity['gas_cost']),
                'mev_protected': result.mev_protected,
                'route': result.route
            }
            
            self.portfolio['trades'].append(trade)
            self.total_trades += 1
            
            if result.success:
                self.successful_trades += 1
                self.total_profit += result.profit or Decimal('0')
                
                logger.info(
                    f"✅ Trade successful: ${result.profit:.2f} profit in {result.execution_time_ms:.2f}ms"
                )
            else:
                logger.error(f"❌ Trade failed: {result.error}")
            
            # Add return to risk engine
            if result.success and result.profit:
                return_pct = float(result.profit / opportunity['amount_in'])
                self.risk_engine.add_return(return_pct)
            
            self.risk_engine.add_trade(trade)
        
        except Exception as e:
            logger.error(f"Execution error: {e}", exc_info=True)
    
    async def _update_portfolio(self):
        """Update portfolio metrics"""
        
        # Calculate total P&L
        total_pnl = sum(
            Decimal(str(t.get('actual_profit', 0)))
            for t in self.portfolio['trades']
        )
        
        self.portfolio['pnl'] = total_pnl
        self.portfolio['total_value'] = Decimal('100000') + total_pnl
        
        # Update peak value
        if self.portfolio['total_value'] > self.portfolio['peak_value']:
            self.portfolio['peak_value'] = self.portfolio['total_value']
    
    async def _log_performance(self):
        """Log performance metrics"""
        
        if self.total_trades == 0:
            return
        
        win_rate = (self.successful_trades / self.total_trades) * 100
        
        # Calculate runtime
        runtime = (datetime.now() - self.start_time).total_seconds() if self.start_time else 0
        runtime_hours = runtime / 3600
        
        # Calculate rates
        trades_per_hour = self.total_trades / runtime_hours if runtime_hours > 0 else 0
        profit_per_hour = float(self.total_profit) / runtime_hours if runtime_hours > 0 else 0
        
        logger.info(
            f"\n"
            f"📊 PERFORMANCE METRICS\n"
            f"{'='*50}\n"
            f"Portfolio Value: ${self.portfolio['total_value']:,.2f}\n"
            f"Total P&L: ${self.portfolio['pnl']:,.2f}\n"
            f"Total Trades: {self.total_trades}\n"
            f"Successful: {self.successful_trades}\n"
            f"Win Rate: {win_rate:.1f}%\n"
            f"Total Profit: ${self.total_profit:,.2f}\n"
            f"Trades/Hour: {trades_per_hour:.2f}\n"
            f"Profit/Hour: ${profit_per_hour:,.2f}\n"
            f"Runtime: {runtime_hours:.2f} hours\n"
            f"{'='*50}"
        )
    
    async def _handle_circuit_breaker(self):
        """Handle circuit breaker trigger"""
        
        logger.critical("🚨 CIRCUIT BREAKER TRIGGERED")
        
        # Stop trading
        self.running = False
        
        # Close all positions (if any)
        # In production, this would close all open positions
        
        # Generate alert
        alert = {
            'type': 'CIRCUIT_BREAKER',
            'timestamp': datetime.now().isoformat(),
            'portfolio_value': float(self.portfolio['total_value']),
            'pnl': float(self.portfolio['pnl']),
            'total_trades': self.total_trades,
            'win_rate': (self.successful_trades / self.total_trades * 100) if self.total_trades > 0 else 0
        }
        
        logger.critical(f"Circuit breaker alert: {json.dumps(alert, indent=2)}")
    
    async def get_status(self) -> Dict[str, Any]:
        """Get current system status"""
        
        # Get component metrics
        multi_chain_metrics = await self.multi_chain_engine.get_performance_metrics()
        execution_metrics = await self.execution_engine.get_performance_metrics()
        strategy_metrics = await self.cross_exchange_strategy.get_performance_metrics()
        
        # Calculate uptime
        uptime_seconds = (datetime.now() - self.start_time).total_seconds() if self.start_time else 0
        
        return {
            'status': 'RUNNING' if self.running else 'STOPPED',
            'uptime_hours': uptime_seconds / 3600,
            'portfolio': {
                'total_value': float(self.portfolio['total_value']),
                'pnl': float(self.portfolio['pnl']),
                'peak_value': float(self.portfolio['peak_value'])
            },
            'trading': {
                'total_trades': self.total_trades,
                'successful_trades': self.successful_trades,
                'win_rate': (self.successful_trades / self.total_trades * 100) if self.total_trades > 0 else 0,
                'total_profit': float(self.total_profit)
            },
            'performance': {
                'multi_chain': multi_chain_metrics,
                'execution': execution_metrics,
                'strategy': strategy_metrics
            },
            'risk': {
                'circuit_breaker_active': self.risk_engine.circuit_breaker_triggered,
                'last_var': self.risk_engine.last_var_calculation.__dict__ if self.risk_engine.last_var_calculation else None
            }
        }
    
    async def stop(self):
        """Stop the orchestrator"""
        logger.info("Stopping Alpha-Orion Enterprise Platform...")
        
        self.running = False
        
        # Close all components
        await asyncio.gather(
            self.multi_chain_engine.close(),
            self.execution_engine.close(),
            self.cross_exchange_strategy.close()
        )
        
        # Final performance log
        await self._log_performance()
        
        logger.info("Alpha-Orion Enterprise Platform stopped")


async def main():
    """Main entry point"""
    
    # Load configuration
    config = {
        'ETHEREUM_RPC_URL': 'https://eth.llamarpc.com',
        'POLYGON_RPC_URL': 'https://polygon-rpc.com',
        'ARBITRUM_RPC_URL': 'https://arb1.arbitrum.io/rpc',
        'OPTIMISM_RPC_URL': 'https://mainnet.optimism.io',
        'BSC_RPC_URL': 'https://bsc-dataseed.binance.org',
        'AVALANCHE_RPC_URL': 'https://api.avax.network/ext/bc/C/rpc',
        'BASE_RPC_URL': 'https://mainnet.base.org',
        'ZKSYNC_RPC_URL': 'https://mainnet.era.zksync.io',
        
        'FLASHBOTS_ENABLED': True,
        'MEV_BLOCKER_ENABLED': True,
        'MAX_GAS_PRICE_GWEI': 500,
        
        'PRIVATE_KEY': None,  # Load from secure storage
        'EXECUTOR_CONTRACT_ADDRESS': None,
        'AAVE_V3_POOL_ADDRESS': None,
    }
    
    # Create orchestrator
    orchestrator = EnterpriseOrchestrator(config)
    
    try:
        # Initialize
        await orchestrator.initialize()
        
        # Start
        await orchestrator.start()
    
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
    
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
    
    finally:
        # Stop
        await orchestrator.stop()


if __name__ == '__main__':
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run
    asyncio.run(main())
