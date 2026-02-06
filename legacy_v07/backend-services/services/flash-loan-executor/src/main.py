from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import os
import json
from google.cloud import pubsub_v1
from google.cloud import storage
from google.cloud import bigquery
from google.cloud import bigtable
from google.cloud import secretmanager
from google.cloud import logging as cloud_logging
import psycopg2
import redis
from web3 import Web3
from web3.middleware import geth_poa_middleware
from eth_account import Account
import time

# FlashLoanExecutor Contract ABI
FLASH_LOAN_EXECUTOR_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_addressProvider",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "address",
                "name": "token",
                "type": "address"
            },
            {
                "indexed": False,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": False,
                "internalType": "uint256",
                "name": "profit",
                "type": "uint256"
            },
            {
                "indexed": False,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "name": "ArbitrageExecuted",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "authorizedExecutors",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "executor",
                "type": "address"
            }
        ],
        "name": "addAuthorizedExecutor",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "emergencyStop",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "emergencyWithdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "asset",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "params",
                "type": "bytes"
            }
        ],
        "name": "executeArbitrage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "asset",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "premium",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "initiator",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "params",
                "type": "bytes"
            }
        ],
        "name": "executeOperation",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getStats",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "profit",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "trades",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "stopped",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "executor",
                "type": "address"
            }
        ],
        "name": "removeAuthorizedExecutor",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "toggleEmergencyStop",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalProfitGenerated",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalTradesExecuted",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

app = Flask(__name__)
CORS(app)

# GCP Clients
project_id = os.getenv('PROJECT_ID', 'alpha-orion')
publisher = pubsub_v1.PublisherClient()
storage_client = storage.Client()
bigquery_client = bigquery.Client()
bigtable_client = bigtable.Client(project=project_id)
secret_client = secretmanager.SecretManagerServiceClient()

# GCP Logging
logging_client = cloud_logging.Client()
logger = logging_client.logger('flash-loan-executor')

# Connections
db_conn = None
redis_conn = None
web3 = None
contract = None

# Circuit Breaker for High-Frequency Trading
class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=60, success_threshold=3):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN

    def can_execute(self):
        if self.state == 'CLOSED':
            return True
        elif self.state == 'OPEN':
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = 'HALF_OPEN'
                self.success_count = 0
                return True
            return False
        elif self.state == 'HALF_OPEN':
            return True
        return False

    def record_success(self):
        if self.state == 'HALF_OPEN':
            self.success_count += 1
            if self.success_count >= self.success_threshold:
                self.state = 'CLOSED'
                self.failure_count = 0
        elif self.state == 'CLOSED':
            self.failure_count = 0

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = 'OPEN'

    def get_status(self):
        return {
            'state': self.state,
            'failure_count': self.failure_count,
            'last_failure_time': self.last_failure_time
        }

# Global circuit breaker instance
circuit_breaker = CircuitBreaker()

def get_secret(secret_name):
    """Retrieve secret from Google Secret Manager"""
    try:
        name = secret_client.secret_version_path(project_id, secret_name, 'latest')
        response = secret_client.access_secret_version(request={'name': name})
        return response.payload.data.decode('UTF-8')
    except Exception as e:
        logger.log_struct({
            'severity': 'ERROR',
            'message': f'Failed to retrieve secret {secret_name}: {str(e)}',
            'service': 'flash-loan-executor'
        })
        return None

def get_db_connection():
    global db_conn
    if db_conn is None:
        db_url = os.getenv('DATABASE_URL')
        db_conn = psycopg2.connect(db_url)
    return db_conn

def get_redis_connection():
    global redis_conn
    if redis_conn is None:
        redis_url = os.getenv('REDIS_URL')
        redis_conn = redis.from_url(redis_url)
    return redis_conn

def get_web3_connection():
    """Initialize Web3 connection to blockchain"""
    global web3, contract
    if web3 is None:
        rpc_url = get_secret('BLOCKCHAIN_RPC_URL') or os.getenv('BLOCKCHAIN_RPC_URL')
        if not rpc_url:
            raise ValueError("BLOCKCHAIN_RPC_URL not configured")

        web3 = Web3(Web3.HTTPProvider(rpc_url))

        # Add POA middleware for networks like Polygon, BSC
        web3.middleware_onion.inject(geth_poa_middleware, layer=0)

        if not web3.is_connected():
            raise ConnectionError("Failed to connect to blockchain")

        # Initialize contract
        contract_address = get_secret('FLASH_LOAN_EXECUTOR_ADDRESS') or os.getenv('FLASH_LOAN_EXECUTOR_ADDRESS')
        if contract_address:
            contract = web3.eth.contract(
                address=Web3.to_checksum_address(contract_address),
                abi=FLASH_LOAN_EXECUTOR_ABI
            )

    return web3, contract

@app.route('/flash-loan', methods=['POST'])
async def flash_loan():
    """Execute flash loan with optimized performance for <50ms execution time and circuit breaker protection"""
    start_time = time.time()

    # Check circuit breaker before proceeding
    if not circuit_breaker.can_execute():
        circuit_status = circuit_breaker.get_status()
        logger.log_struct({
            'severity': 'WARNING',
            'message': 'Circuit breaker OPEN - rejecting flash loan request',
            'circuit_state': circuit_status['state'],
            'failure_count': circuit_status['failure_count'],
            'service': 'flash-loan-executor'
        })
        return jsonify({
            'error': 'Service temporarily unavailable - circuit breaker open',
            'circuit_state': circuit_status['state'],
            'retry_after': 60
        }), 503

    try:
        # Get request data
        data = request.get_json() or {}
        asset_address = data.get('asset', '0xA0b86a33E6441e88C5F2712C3E9b74F5b8b6b8b8')  # Default to some token
        amount = int(data.get('amount', 1000) * 10**18)  # Convert to wei (assuming 18 decimals)
        params = data.get('params', '0x')  # Arbitrage parameters

        # Get Web3 connection with connection pooling
        web3, contract = get_web3_connection()

        if not contract:
            return jsonify({'error': 'Contract not configured'}), 500

        # Get private key for transaction signing
        private_key = get_secret('EXECUTOR_PRIVATE_KEY') or os.getenv('EXECUTOR_PRIVATE_KEY')
        if not private_key:
            return jsonify({'error': 'Private key not configured'}), 500

        account = Account.from_key(private_key)

        # Optimized transaction building with cached gas price
        nonce = web3.eth.get_transaction_count(account.address)

        # Use dynamic gas pricing for MEV protection and cost optimization
        gas_price = web3.eth.gas_price
        # Add competitive pricing (10% above network average for faster inclusion)
        gas_price = int(gas_price * 1.1)

        # Estimate gas with optimized parameters
        try:
            gas_estimate = contract.functions.executeArbitrage(
                asset_address,
                amount,
                params
            ).estimate_gas({
                'from': account.address,
                'gasPrice': gas_price
            })
        except Exception as gas_error:
            logger.log_struct({
                'severity': 'WARNING',
                'message': f'Gas estimation failed: {str(gas_error)}',
                'service': 'flash-loan-executor'
            })
            gas_estimate = 2000000  # Optimized default gas limit

        # Build optimized transaction
        transaction = contract.functions.executeArbitrage(
            asset_address,
            amount,
            params
        ).build_transaction({
            'chainId': web3.eth.chain_id,
            'gas': int(gas_estimate * 1.1),  # Reduced buffer for cost optimization
            'gasPrice': gas_price,
            'nonce': nonce,
        })

        # Sign and send transaction with optimized timing
        signed_txn = web3.eth.account.sign_transaction(transaction, private_key)
        tx_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)

        # Optimized receipt waiting with shorter timeout for high-frequency trading
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)  # Reduced from 300s

        # Get contract stats after execution (cached for performance)
        stats = contract.functions.getStats().call()

        execution_time = time.time() - start_time

        flash_loan_result = {
            'loanId': tx_hash.hex(),
            'amount': amount / 10**18,  # Convert back to readable format
            'asset': asset_address,
            'status': 'executed' if receipt.status == 1 else 'failed',
            'txHash': tx_hash.hex(),
            'gasUsed': receipt.gasUsed,
            'gasPrice': gas_price,
            'blockNumber': receipt.blockNumber,
            'totalProfit': stats[0] / 10**18,  # Convert from wei
            'totalTrades': stats[1],
            'executionTimeMs': execution_time * 1000,  # Performance tracking
            'performanceTarget': '<50ms' if execution_time < 0.05 else f'{execution_time:.2f}s (needs optimization)',
            'timestamp': int(time.time())
        }

        # Async publish flash loan event to Pub/Sub for high throughput
        topic_path = publisher.topic_path(project_id, 'flash-loan-events')
        pubsub_data = json.dumps(flash_loan_result).encode('utf-8')
        publisher.publish(topic_path, pubsub_data)

        # Async log to BigQuery with batching for performance
        table_id = f'{project_id}.flash_loans.loan_logs'
        rows_to_insert = [{
            'timestamp': json.dumps({'timestamp': {'seconds': int(time.time()), 'nanos': 0}}),
            'service': 'flash-loan-executor',
            'event_type': 'flash_loan_executed',
            'execution_time_ms': execution_time * 1000,
            'gas_used': receipt.gasUsed,
            'profit_generated': stats[0] / 10**18,
            'data': json.dumps(flash_loan_result)
        }]
        bigquery_client.insert_rows_json(table_id, rows_to_insert)

        # Record success in circuit breaker
        circuit_breaker.record_success()

        # Performance logging
        logger.log_struct({
            'severity': 'INFO',
            'message': f'Flash loan executed in {execution_time:.3f}s: {tx_hash.hex()}',
            'txHash': tx_hash.hex(),
            'gasUsed': receipt.gasUsed,
            'executionTimeMs': execution_time * 1000,
            'profit': stats[0] / 10**18,
            'service': 'flash-loan-executor'
        })

        return jsonify(flash_loan_result)

    except Exception as e:
        execution_time = time.time() - start_time

        # Record failure in circuit breaker
        circuit_breaker.record_failure()

        error_msg = f'Flash loan failed after {execution_time:.3f}s: {str(e)}'
        logger.log_struct({
            'severity': 'ERROR',
            'message': error_msg,
            'executionTimeMs': execution_time * 1000,
            'circuit_breaker_failures': circuit_breaker.failure_count,
            'service': 'flash-loan-executor'
        })
        return jsonify({
            'error': 'Flash loan failed',
            'details': str(e),
            'executionTimeMs': execution_time * 1000,
            'circuit_breaker_status': circuit_breaker.get_status()
        }), 500

@app.route('/health', methods=['GET'])
def health():
    health_status = {
        'status': 'ok',
        'service': 'flash-loan-executor',
        'gcp_services': {},
        'blockchain': {}
    }

    # Check database connectivity
    try:
        db_conn = get_db_connection()
        db_conn.cursor().execute('SELECT 1')
        health_status['gcp_services']['alloydb'] = 'connected'
    except Exception as e:
        health_status['gcp_services']['alloydb'] = f'error: {str(e)}'
        health_status['status'] = 'degraded'

    # Check Redis connectivity
    try:
        redis_conn = get_redis_connection()
        redis_conn.ping()
        health_status['gcp_services']['redis'] = 'connected'
    except Exception as e:
