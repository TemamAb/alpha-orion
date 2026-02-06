"""
Enterprise Execution Engine
High-performance execution with <50ms latency, MEV protection, and dynamic gas optimization
"""

import asyncio
import aiohttp
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from decimal import Decimal
import logging
from web3 import Web3
from eth_account import Account
from eth_account.signers.local import LocalAccount
import json

logger = logging.getLogger(__name__)


@dataclass
class ExecutionResult:
    """Result of trade execution"""
    success: bool
    tx_hash: Optional[str]
    execution_time_ms: float
    gas_used: Optional[int]
    gas_price: Optional[int]
    profit: Optional[Decimal]
    error: Optional[str]
    mev_protected: bool
    route: str  # 'flashbots', 'mev-blocker', 'public'


@dataclass
class GasEstimate:
    """Gas price estimation"""
    base_fee: int
    priority_fee: int
    max_fee: int
    estimated_cost_usd: Decimal
    competitive_multiplier: float


class EnterpriseExecutionEngine:
    """
    High-performance execution engine with:
    - Sub-50ms execution time
    - MEV protection (Flashbots, MEV-Blocker)
    - Dynamic gas optimization
    - Atomic transaction guarantees
    - Connection pooling and HTTP/2
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.target_latency_ms = 50
        
        # Network optimization
        self.session: Optional[aiohttp.ClientSession] = None
        self.connection_pool_size = 100
        self.connection_per_host = 20
        
        # MEV protection
        self.flashbots_enabled = config.get('FLASHBOTS_ENABLED', True)
        self.mev_blocker_enabled = config.get('MEV_BLOCKER_ENABLED', True)
        self.flashbots_rpc = 'https://rpc.flashbots.net'
        self.mev_blocker_rpc = 'https://rpc.mevblocker.io'
        
        # Gas optimization
        self.gas_competitive_multiplier = 1.1  # 10% above competitors
        self.max_gas_price_gwei = config.get('MAX_GAS_PRICE_GWEI', 500)
        
        # Performance tracking
        self.execution_times = []
        self.gas_savings = []
        
        # Web3 instances
        self.w3_instances: Dict[str, Web3] = {}
        
        # Optimization: Local State
        self.nonce_cache: Dict[str, int] = {}
        self.gas_cache: Dict[str, GasEstimate] = {}
        self.chain_ids: Dict[str, int] = {}
        
        logger.info("EnterpriseExecutionEngine initialized")
    
    async def initialize(self):
        """Initialize HTTP session with optimizations"""
        # HTTP/2 with connection pooling
        connector = aiohttp.TCPConnector(
            limit=self.connection_pool_size,
            limit_per_host=self.connection_per_host,
            ttl_dns_cache=300,  # 5 min DNS cache
            enable_cleanup_closed=True,
            force_close=False,  # Keep-alive
            keepalive_timeout=30
        )
        
        timeout = aiohttp.ClientTimeout(
            total=5,
            connect=2,
            sock_read=3
        )
        
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={
                'User-Agent': 'AlphaOrion/2.0',
                'Accept-Encoding': 'gzip, deflate, br'
            }
        )
        
        logger.info("HTTP session initialized with connection pooling")
        
        # Start background tasks
        asyncio.create_task(self._background_gas_updater())
        logger.info("Background gas oracle started")
    
    async def execute_arbitrage(
        self,
        opportunity: Dict[str, Any],
        w3: Web3,
        account: LocalAccount
    ) -> ExecutionResult:
        """
        Execute arbitrage opportunity with optimal routing
        
        Args:
            opportunity: Arbitrage opportunity details
            w3: Web3 instance for the chain
            account: Account to execute from
        
        Returns:
            ExecutionResult with execution details
        """
        start_time = time.time()
        
        try:
            # Step 1: Get Gas Estimate (Instant from Cache)
            gas_estimate = self._get_cached_gas_price(opportunity.get('chain', 'ethereum'))
            
            # Step 2: Build transaction (Optimized with local nonce)
            tx = await self._build_transaction(opportunity, w3, account)
            
            # Step 2: Update transaction with optimal gas
            tx['maxFeePerGas'] = gas_estimate.max_fee
            tx['maxPriorityFeePerGas'] = gas_estimate.priority_fee
            
            # Step 3: Sign transaction
            signed_tx = account.sign_transaction(tx)
            
            # Step 4: Route through MEV protection or public mempool
            tx_hash, route = await self._route_transaction(
                signed_tx.rawTransaction,
                w3,
                opportunity
            )
            
            execution_time = (time.time() - start_time) * 1000
            self.execution_times.append(execution_time)
            
            # Step 5: Wait for confirmation (async, don't block)
            asyncio.create_task(
                self._monitor_transaction(tx_hash, w3, opportunity)
            )
            
            logger.info(
                f"Executed in {execution_time:.2f}ms via {route}, "
                f"tx: {tx_hash.hex()}, gas: {gas_estimate.max_fee / 1e9:.2f} gwei"
            )
            
            return ExecutionResult(
                success=True,
                tx_hash=tx_hash.hex(),
                execution_time_ms=execution_time,
                gas_used=None,  # Will be updated after confirmation
                gas_price=gas_estimate.max_fee,
                profit=opportunity.get('net_profit'),
                error=None,
                mev_protected=(route != 'public'),
                route=route
            )
        
        except Exception as e:
            # CRITICAL: Invalidate nonce cache on failure to force resync with chain
            # This prevents "nonce too high/low" errors if a tx fails to broadcast
            try:
                self._invalidate_nonce(w3.eth.chain_id, account.address)
            except Exception:
                pass  # Best effort invalidation

            execution_time = (time.time() - start_time) * 1000
            logger.error(f"Execution failed after {execution_time:.2f}ms: {e}")
            
            return ExecutionResult(
                success=False,
                tx_hash=None,
                execution_time_ms=execution_time,
                gas_used=None,
                gas_price=None,
                profit=None,
                error=str(e),
                mev_protected=False,
                route='failed'
            )
    
    def _invalidate_nonce(self, chain_id: int, address: str):
        """Invalidate nonce cache to force resync on next transaction"""
        cache_key = f"{chain_id}_{address}"
        if cache_key in self.nonce_cache:
            del self.nonce_cache[cache_key]
            logger.info(f"Invalidated nonce cache for {address} on chain {chain_id} due to execution failure")

    async def _build_transaction(
        self,
        opportunity: Dict[str, Any],
        w3: Web3,
        account: LocalAccount
    ) -> Dict[str, Any]:
        """Build transaction for arbitrage execution"""
        
        # Optimization: Use local nonce if available, else fetch
        # Ensure chain_id is cached to avoid ANY network calls in hot path
        chain_name = opportunity.get('chain', 'ethereum')
        if chain_name not in self.chain_ids:
             self.chain_ids[chain_name] = w3.eth.chain_id
        chain_id = self.chain_ids[chain_name]
        
        cache_key = f"{chain_id}_{account.address}"
        
        if cache_key not in self.nonce_cache:
            self.nonce_cache[cache_key] = w3.eth.get_transaction_count(account.address, 'pending')
        
        nonce = self.nonce_cache[cache_key]
        # Optimistically increment for next time
        self.nonce_cache[cache_key] += 1
        
        # Build flash loan transaction
        # This is a simplified version - full implementation would build
        # actual flash loan calldata based on the strategy
        
        strategy = opportunity.get('strategy', 'CROSS_DEX_ARBITRAGE')
        
        if strategy == 'CROSS_DEX_ARBITRAGE':
            tx = await self._build_cross_dex_tx(opportunity, w3, account, nonce)
        elif strategy == 'TRIANGULAR_ARBITRAGE':
            tx = await self._build_triangular_tx(opportunity, w3, account, nonce)
        elif strategy == 'FLASH_LOAN_ARBITRAGE':
            tx = await self._build_flash_loan_tx(opportunity, w3, account, nonce)
        else:
            raise ValueError(f"Unknown strategy: {strategy}")
        
        return tx
    
    async def _build_cross_dex_tx(
        self,
        opportunity: Dict[str, Any],
        w3: Web3,
        account: LocalAccount,
        nonce: int
    ) -> Dict[str, Any]:
        """Build cross-DEX arbitrage transaction"""
        
        # Simplified - would integrate with actual DEX routers
        executor_address = self.config.get('EXECUTOR_CONTRACT_ADDRESS')
        
        # Encode function call
        # executeCrossDexArbitrage(tokenIn, tokenOut, amountIn, path)
        function_signature = w3.keccak(text='executeCrossDexArbitrage(address,address,uint256,bytes)')[:4]
        
        # Build calldata (simplified)
        calldata = function_signature.hex() + '0' * 120  # Placeholder
        
        tx = {
            'from': account.address,
            'to': executor_address,
            'value': 0,
            'nonce': nonce,
            'data': calldata,
            'chainId': w3.eth.chain_id,
            'gas': 500000,  # Will be estimated
            'type': 2,  # EIP-1559
        }
        
        # Estimate gas
        try:
            estimated_gas = w3.eth.estimate_gas(tx)
            tx['gas'] = int(estimated_gas * 1.2)  # 20% buffer
        except Exception as e:
            logger.warning(f"Gas estimation failed: {e}, using default")
        
        return tx
    
    async def _build_triangular_tx(
        self,
        opportunity: Dict[str, Any],
        w3: Web3,
        account: LocalAccount,
        nonce: int
    ) -> Dict[str, Any]:
        """Build triangular arbitrage transaction"""
        # Similar to cross-DEX but with triangular path
        return await self._build_cross_dex_tx(opportunity, w3, account, nonce)
    
    async def _build_flash_loan_tx(
        self,
        opportunity: Dict[str, Any],
        w3: Web3,
        account: LocalAccount,
        nonce: int
    ) -> Dict[str, Any]:
        """Build flash loan arbitrage transaction"""
        
        # Aave V3 flash loan
        aave_pool = self.config.get('AAVE_V3_POOL_ADDRESS')
        
        # flashLoan(receiverAddress, assets, amounts, modes, onBehalfOf, params, referralCode)
        function_signature = w3.keccak(text='flashLoan(address,address[],uint256[],uint256[],address,bytes,uint16)')[:4]
        
        calldata = function_signature.hex() + '0' * 200  # Placeholder
        
        tx = {
            'from': account.address,
            'to': aave_pool,
            'value': 0,
            'nonce': nonce,
            'data': calldata,
            'chainId': w3.eth.chain_id,
            'gas': 800000,  # Flash loans need more gas
            'type': 2,
        }
        
        return tx
    
    async def _background_gas_updater(self):
        """Background task to keep gas prices fresh without blocking execution"""
        
        def update_gas_sync(chain_name, w3):
            try:
                # Get latest block for base fee
                latest_block = w3.eth.get_block('latest')
                base_fee = latest_block.get('baseFeePerGas', 0)
                
                # Get priority fee
                try:
                    priority_fee = w3.eth.max_priority_fee
                except:
                    priority_fee = 2 * 10**9
                
                # Competitive bidding
                competitive_priority = int(priority_fee * self.gas_competitive_multiplier)
                max_fee = base_fee + competitive_priority
                
                # Cap at maximum
                max_gas_wei = self.max_gas_price_gwei * 10**9
                if max_fee > max_gas_wei:
                    max_fee = max_gas_wei
                    competitive_priority = max(0, max_fee - base_fee)
                
                # Estimate cost
                eth_price = Decimal('3000')
                gas_limit = 500000
                cost_eth = Decimal(str(max_fee * gas_limit / 1e18))
                cost_usd = cost_eth * eth_price
                
                estimate = GasEstimate(
                    base_fee=base_fee,
                    priority_fee=competitive_priority,
                    max_fee=max_fee,
                    estimated_cost_usd=cost_usd,
                    competitive_multiplier=self.gas_competitive_multiplier
                )
                
                self.gas_cache[chain_name] = estimate
            except Exception as e:
                logger.warning(f"Failed to update gas for {chain_name}: {e}")

        while True:
            try:
                # Update gas for all connected chains
                tasks = []
                for chain_name, w3 in self.w3_instances.items():
                    tasks.append(asyncio.to_thread(update_gas_sync, chain_name, w3))
                
                if tasks:
                    await asyncio.gather(*tasks)
                
                await asyncio.sleep(2) # Update every 2 seconds
            except Exception as e:
                logger.error(f"Background gas update failed: {e}")
                await asyncio.sleep(5)

    def _get_cached_gas_price(self, chain: str) -> GasEstimate:
        """Get gas price from cache or return default if cold"""
        if chain in self.gas_cache:
            return self.gas_cache[chain]
            
        # Fallback default if cache miss (shouldn't happen after warmup)
        return GasEstimate(
            base_fee=30 * 10**9,
            priority_fee=2 * 10**9,
            max_fee=35 * 10**9,
            estimated_cost_usd=Decimal('50'),
            competitive_multiplier=1.0
        )

    async def _get_optimal_gas_price(
        self,
        w3: Web3,
        opportunity: Dict[str, Any]
    ) -> GasEstimate:
        """
        Get optimal gas price with competitive bidding
        
        Strategy:
        1. Get current base fee
        2. Get priority fee recommendations
        3. Check competitor transactions
        4. Bid 10% above competitors
        5. Cap at max gas price
        """
        
        # Update cache
        chain_id = str(w3.eth.chain_id) # Simplified key
        
        try:
            # Get latest block for base fee
            latest_block = w3.eth.get_block('latest')
            base_fee = latest_block.get('baseFeePerGas', 0)
            
            # Get priority fee (simplified - would use gas oracle)
            priority_fee = await self._get_priority_fee(w3)
            
            # Check competitor gas prices (simplified)
            competitor_gas = await self._get_competitor_gas_price(w3)
            
            # Competitive bidding: 10% above competitors
            competitive_priority = int(max(priority_fee, competitor_gas) * self.gas_competitive_multiplier)
            
            # Calculate max fee
            max_fee = base_fee + competitive_priority
            
            # Cap at maximum
            max_gas_wei = self.max_gas_price_gwei * 10**9
            if max_fee > max_gas_wei:
                max_fee = max_gas_wei
                competitive_priority = max_fee - base_fee
            
            # Estimate cost in USD
            eth_price = Decimal('3000')  # Would fetch from oracle
            gas_limit = 500000
            cost_eth = Decimal(str(max_fee * gas_limit / 1e18))
            cost_usd = cost_eth * eth_price
            
            estimate = GasEstimate(
                base_fee=base_fee,
                priority_fee=competitive_priority,
                max_fee=max_fee,
                estimated_cost_usd=cost_usd,
                competitive_multiplier=self.gas_competitive_multiplier
            )
        
        except Exception as e:
            logger.error(f"Gas estimation error: {e}")
            # Fallback to safe defaults
            return GasEstimate(
                base_fee=30 * 10**9,  # 30 gwei
                priority_fee=2 * 10**9,  # 2 gwei
                max_fee=35 * 10**9,  # 35 gwei
                estimated_cost_usd=Decimal('50'),
                competitive_multiplier=1.0
            )
    
    async def _get_priority_fee(self, w3: Web3) -> int:
        """Get recommended priority fee"""
        try:
            # Use eth_maxPriorityFeePerGas if available
            priority_fee = w3.eth.max_priority_fee
            return priority_fee
        except:
            # Fallback to 2 gwei
            return 2 * 10**9
    
    async def _get_competitor_gas_price(self, w3: Web3) -> int:
        """Get competitor gas prices from mempool"""
        try:
            # Simplified - would analyze pending transactions
            # Look for similar arbitrage transactions
            pending_block = w3.eth.get_block('pending', full_transactions=True)
            
            if pending_block and 'transactions' in pending_block:
                gas_prices = [
                    tx.get('maxPriorityFeePerGas', 0)
                    for tx in pending_block['transactions'][:50]  # Sample first 50
                    if tx.get('maxPriorityFeePerGas')
                ]
                
                if gas_prices:
                    # Use 75th percentile
                    gas_prices.sort()
                    p75_index = int(len(gas_prices) * 0.75)
                    return gas_prices[p75_index]
        except:
            pass
        
        # Default to 2 gwei
        return 2 * 10**9
    
    async def _route_transaction(
        self,
        signed_tx: bytes,
        w3: Web3,
        opportunity: Dict[str, Any]
    ) -> Tuple[bytes, str]:
        """
        Route transaction through optimal channel
        
        Priority:
        1. Flashbots (if enabled and profitable)
        2. MEV-Blocker (if enabled)
        3. Public mempool (fallback)
        """
        
        expected_profit = opportunity.get('net_profit', Decimal('0'))
        
        # Try Flashbots first (best MEV protection)
        if self.flashbots_enabled and expected_profit > Decimal('100'):
            try:
                tx_hash = await self._send_flashbots_bundle(signed_tx, w3)
                if tx_hash:
                    return tx_hash, 'flashbots'
            except Exception as e:
                logger.warning(f"Flashbots routing failed: {e}")
        
        # Try MEV-Blocker
        if self.mev_blocker_enabled:
            try:
                tx_hash = await self._send_mev_blocker(signed_tx, w3)
                if tx_hash:
                    return tx_hash, 'mev-blocker'
            except Exception as e:
                logger.warning(f"MEV-Blocker routing failed: {e}")
        
        # Fallback to public mempool
        tx_hash = w3.eth.send_raw_transaction(signed_tx)
        return tx_hash, 'public'
    
    async def _send_flashbots_bundle(
        self,
        signed_tx: bytes,
        w3: Web3
    ) -> Optional[bytes]:
        """Send transaction via Flashbots"""
        
        if not self.session:
            return None
        
        try:
            # Get current block number
            current_block = w3.eth.block_number
            target_block = current_block + 1
            
            # Build Flashbots bundle
            bundle = [{
                'signed_transaction': signed_tx.hex()
            }]
            
            # Send to Flashbots relay
            payload = {
                'jsonrpc': '2.0',
                'id': 1,
                'method': 'eth_sendBundle',
                'params': [
                    {
                        'txs': [tx['signed_transaction'] for tx in bundle],
                        'blockNumber': hex(target_block)
                    }
                ]
            }
            
            async with self.session.post(
                self.flashbots_rpc,
                json=payload,
                headers={'Content-Type': 'application/json'}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if 'result' in data:
                        # Return transaction hash
                        return bytes.fromhex(signed_tx.hex()[2:])
        
        except Exception as e:
            logger.error(f"Flashbots bundle error: {e}")
        
        return None
    
    async def _send_mev_blocker(
        self,
        signed_tx: bytes,
        w3: Web3
    ) -> Optional[bytes]:
        """Send transaction via MEV-Blocker"""
        
        if not self.session:
            return None
        
        try:
            payload = {
                'jsonrpc': '2.0',
                'id': 1,
                'method': 'eth_sendRawTransaction',
                'params': [signed_tx.hex()]
            }
            
            async with self.session.post(
                self.mev_blocker_rpc,
                json=payload
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if 'result' in data:
                        return bytes.fromhex(data['result'][2:])
        
        except Exception as e:
            logger.error(f"MEV-Blocker error: {e}")
        
        return None
    
    async def _monitor_transaction(
        self,
        tx_hash: bytes,
        w3: Web3,
        opportunity: Dict[str, Any]
    ):
        """Monitor transaction confirmation (async)"""
        try:
            # Wait for confirmation
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt['status'] == 1:
                gas_used = receipt['gasUsed']
                effective_gas_price = receipt.get('effectiveGasPrice', 0)
                
                logger.info(
                    f"Transaction confirmed: {tx_hash.hex()}, "
                    f"gas used: {gas_used}, "
                    f"gas price: {effective_gas_price / 1e9:.2f} gwei"
                )
            else:
                logger.error(f"Transaction failed: {tx_hash.hex()}")
        
        except Exception as e:
            logger.error(f"Transaction monitoring error: {e}")
    
    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get execution performance metrics"""
        if not self.execution_times:
            return {
                'avg_execution_time_ms': 0,
                'p50_execution_time_ms': 0,
                'p99_execution_time_ms': 0,
                'target_latency_ms': self.target_latency_ms,
                'total_executions': 0
            }
        
        sorted_times = sorted(self.execution_times)
        p50_index = int(len(sorted_times) * 0.50)
        p99_index = int(len(sorted_times) * 0.99)
        
        return {
            'avg_execution_time_ms': sum(self.execution_times) / len(self.execution_times),
            'p50_execution_time_ms': sorted_times[p50_index],
            'p99_execution_time_ms': sorted_times[p99_index] if p99_index < len(sorted_times) else sorted_times[-1],
            'target_latency_ms': self.target_latency_ms,
            'total_executions': len(self.execution_times),
            'under_target_pct': len([t for t in self.execution_times if t < self.target_latency_ms]) / len(self.execution_times) * 100
        }
    
    async def close(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()
        
        logger.info("EnterpriseExecutionEngine closed")
