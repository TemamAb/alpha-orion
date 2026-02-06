from flask import Flask, jsonify
from flask_cors import CORS
import random
import os
import json
from google.cloud import pubsub_v1
from google.cloud import storage
from google.cloud import bigquery
from google.cloud import bigtable
from google.cloud import secretmanager
import psycopg2
import redis
from web3 import Web3

# Import multi-chain RPC manager
import sys
sys.path.append('/app/backend-services/services/eye-scanner/src')
from main import rpc_manager

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
logger = logging_client.logger('hand-blockchain-proxy')

# Connections
db_conn = None
redis_conn = None
web3_conn = None

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
            'service': 'hand-blockchain-proxy'
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

def get_system_mode():
    redis_conn = get_redis_connection()
    mode = redis_conn.get('system_mode')
    return mode.decode('utf-8') if mode else 'sim'  # default to sim

def get_web3_connection(chain_name='ethereum'):
    """Get Web3 connection for specified chain with automatic fallback"""
    # For now, use simple fallback logic - in production, use shared RPC manager
    infura_key = os.getenv('INFURA_PROJECT_ID') or 'YOUR_INFURA_PROJECT_ID'

    chain_configs = {
        'ethereum': [f'https://mainnet.infura.io/v3/{infura_key}', 'https://eth.llamarpc.com'],
        'polygon': [f'https://polygon-mainnet.infura.io/v3/{infura_key}', 'https://polygon.llamarpc.com'],
        'arbitrum': [f'https://arbitrum-mainnet.infura.io/v3/{infura_key}', 'https://arbitrum.llamarpc.com'],
        'optimism': [f'https://optimism-mainnet.infura.io/v3/{infura_key}', 'https://optimism.llamarpc.com'],
        'bsc': [f'https://bsc-mainnet.infura.io/v3/{infura_key}', 'https://bsc.llamarpc.com']
    }

    rpc_urls = chain_configs.get(chain_name, chain_configs['ethereum'])

    for rpc_url in rpc_urls:
        try:
            web3 = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={'timeout': 10}))
            if web3.is_connected():
                return web3
        except Exception as e:
            continue

    raise Exception(f"All RPC connections failed for {chain_name}")

@app.route('/proxy', methods=['GET'])
def proxy():
    """Get blockchain data for Ethereum (legacy endpoint)"""
    return get_chain_data('ethereum')

@app.route('/proxy/<chain_name>', methods=['GET'])
def get_chain_proxy(chain_name):
    """Get blockchain data for specified chain"""
    return get_chain_data(chain_name)

def get_chain_data(chain_name):
    """Get blockchain data for specified chain"""
    mode = get_system_mode()

    try:
        web3 = get_web3_connection(chain_name)
        block_number = web3.eth.block_number
        gas_price = web3.eth.gas_price / 10**9  # Convert to gwei
        latest_block = web3.eth.get_block('latest')
        transaction_count = len(latest_block['transactions'])

        data = {
            'chain': chain_name,
            'blockNumber': block_number,
            'gasPrice': gas_price,
            'transactions': transaction_count,
            'timestamp': int(time.time() * 1000)
        }

        return jsonify(data)

    except Exception as e:
        return jsonify({
            'error': f'Blockchain connection failed for {chain_name}',
            'details': str(e),
            'chain': chain_name
        }), 503

@app.route('/health', methods=['GET'])
def health():
    health_status = {
        'status': 'ok',
        'service': 'hand-blockchain-proxy',
        'gcp_services': {}
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
        health_status['gcp_services']['redis'] = f'error: {str(e)}'
        health_status['status'] = 'degraded'

    # Check Pub/Sub connectivity
    try:
        topic_path = publisher.topic_path(project_id, 'blockchain-data')
        # Just check if we can get topic info
        publisher.get_topic(request={'topic': topic_path})
        health_status['gcp_services']['pubsub'] = 'connected'
    except Exception as e:
        health_status['gcp_services']['pubsub'] = f'error: {str(e)}'
        health_status['status'] = 'degraded'

    # Check BigQuery connectivity
    try:
        # Simple query to check connectivity
        query = f'SELECT 1 FROM `{project_id}.blockchain.blockchain_data` LIMIT 1'
        bigquery_client.query(query).result()
        health_status['gcp_services']['bigquery'] = 'connected'
    except Exception as e:
        health_status['gcp_services']['bigquery'] = f'error: {str(e)}'
        health_status['status'] = 'degraded'

    return jsonify(health_status)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
