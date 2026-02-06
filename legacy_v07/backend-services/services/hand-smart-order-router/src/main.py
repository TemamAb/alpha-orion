from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import os
import json
import requests
from google.cloud import pubsub_v1
from google.cloud import storage
from google.cloud import bigquery
from google.cloud import bigtable
from google.cloud import secretmanager
import psycopg2
import redis

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
logger = logging_client.logger('hand-smart-order-router')

# Connections
db_conn = None
redis_conn = None

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
            'service': 'hand-smart-order-router'
        })
        return None

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
            'service': 'hand-smart-order-router'
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

def get_openocean_quote(from_token, to_token, amount, slippage=0.5):
    """Get quote from OpenOcean API for optimal DEX routing"""
    try:
        # OpenOcean API endpoint
        base_url = "https://open-api.openocean.finance/v3"
        chain_id = "1"  # Ethereum mainnet

        # Convert token addresses to OpenOcean format if needed
        token_map = {
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'ETH',  # WETH
            '0xA0b86a33E6441e88C5F2712C3E9b74F5c4d6E3E': 'USDC',
            '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'USDT',
            '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 'WBTC',
            '0x6B175474E89094C44Da98b954EedeAC495271d0F': 'DAI'
        }

        from_symbol = token_map.get(from_token, from_token)
        to_symbol = token_map.get(to_token, to_token)

        # OpenOcean quote endpoint
        url = f"{base_url}/{chain_id}/quote"
        params = {
            'inTokenAddress': from_token,
            'outTokenAddress': to_token,
            'amount': str(amount),
            'slippage': str(slippage),
            'gasPrice': '50'  # gwei
        }

        response = requests.get(url, params=params, timeout=10)

        if response.status_code == 200:
            data = response.json()
            if data.get('code') == 200 and 'data' in data:
                return data
        else:
            print(f"OpenOcean API error: {response.status_code} - {response.text}")

    except Exception as e:
        print(f"OpenOcean API request failed: {e}")

    return None

@app.route('/route', methods=['POST'])
def route():
    # Real smart order routing - requires order details
    data = request.get_json()
    if not data or 'fromToken' not in data or 'toToken' not in data or 'amount' not in data:
        return jsonify({'error': 'Missing required fields: fromToken, toToken, amount'}), 400

    # Integrate with OpenOcean API for optimal routing
    try:
        openocean_response = get_openocean_quote(
            data['fromToken'],
            data['toToken'],
            data['amount'],
            data.get('slippage', 0.5)
        )

        if openocean_response and 'data' in openocean_response:
            route_data = openocean_response['data']
            routing = {
                'bestExchange': route_data.get('dex', 'OpenOcean Aggregator'),
                'estimatedFee': float(route_data.get('fee', 0.003)),
                'slippage': float(route_data.get('slippage', 0.005)),
                'route': [data['fromToken'], data['toToken']],
                'estimatedGas': route_data.get('estimatedGas', 150000),
                'minimumReceived': route_data.get('toTokenAmount', 0),
                'priceImpact': route_data.get('priceImpact', 0),
                'aggregator': 'OpenOcean'
            }
        else:
            # Fallback to basic routing
            routing = {
                'bestExchange': 'Uniswap V3',
                'estimatedFee': 0.003,
                'slippage': 0.002,
                'route': [data['fromToken'], data['toToken']],
                'aggregator': 'Fallback'
            }
    except Exception as e:
        return jsonify({'error': 'OpenOcean API integration failed', 'details': str(e)}), 500

    # Publish routing decision to Pub/Sub
    topic_path = publisher.topic_path(project_id, 'routing-decisions')
    routing_data = json.dumps(routing).encode('utf-8')
    publisher.publish(topic_path, routing_data)

    # Log to BigQuery
    table_id = f'{project_id}.routing.routing_logs'
    rows_to_insert = [{
        'timestamp': json.dumps({'timestamp': {'seconds': int(os.times()[4]), 'nanos': 0}}),
        'service': 'hand-smart-order-router',
        'event_type': 'routing_decision',
        'data': json.dumps(routing)
    }]
    bigquery_client.insert_rows_json(table_id, rows_to_insert)

    return jsonify(routing)

@app.route('/batch-auction', methods=['POST'])
def batch_auction():
    """Create CoW Protocol batch auction for multiple orders"""
    try:
        data = request.get_json()
        if not data or 'orders' not in data:
            return jsonify({'error': 'Missing orders array'}), 400

        orders = data['orders']
        if not isinstance(orders, list) or len(orders) == 0:
            return jsonify({'error': 'Orders must be a non-empty array'}), 400

        # Validate order structure
        required_fields = ['sellToken', 'buyToken', 'sellAmount']
        for i, order in enumerate(orders):
            missing = [field for field in required_fields if field not in order]
            if missing:
                return jsonify({'error': f'Order {i} missing fields: {missing}'}), 400

        # Create batch auction
        batch_result = create_cow_batch_auction(orders)

        if not batch_result['success']:
            return jsonify({'error': batch_result.get('error', 'Batch creation failed')}), 500

        # Publish batch auction to Pub/Sub
        topic_path = publisher.topic_path(project_id, 'batch-auctions')
        batch_data = json.dumps({
            'batchId': f"batch_{int(os.times()[4])}_{random.randint(1000, 9999)}",
            'orders': batch_result['batchOrders'],
            'totalOrders': batch_result['totalOrders'],
            'totalVolume': batch_result['totalVolume'],
            'estimatedSavingsPct': batch_result['estimatedSavingsPct']
        }).encode('utf-8')
        publisher.publish(topic_path, batch_data)

        # Log to BigQuery
        table_id = f'{project_id}.routing.batch_auction_logs'
        rows_to_insert = [{
            'timestamp': json.dumps({'timestamp': {'seconds': int(os.times()[4]), 'nanos': 0}}),
            'service': 'hand-smart-order-router',
            'event_type': 'batch_auction_created',
            'data': json.dumps(batch_result)
        }]
        bigquery_client.insert_rows_json(table_id, rows_to_insert)

        return jsonify(batch_result)

    except Exception as e:
        logger.log_struct({
            'severity': 'ERROR',
            'message': f'Batch auction failed: {str(e)}',
            'service': 'hand-smart-order-router'
        })
        return jsonify({'error': 'Batch auction creation failed', 'details': str(e)}), 500

@app.route('/cow-quote', methods=['POST'])
def cow_quote():
    """Get CoW Protocol quote for single order"""
    try:
        data = request.get_json()
        if not data or 'sellToken' not in data or 'buyToken' not in data or 'sellAmount' not in data:
            return jsonify({'error': 'Missing required fields: sellToken, buyToken, sellAmount'}), 400

        quote = get_cow_protocol_quote(
            data['sellToken'],
            data['buyToken'],
            data['sellAmount'],
            data.get('chainId', '1')
        )

        if quote['success']:
            return jsonify(quote)
        else:
            return jsonify({'error': quote.get('error', 'Quote failed')}), 500

    except Exception as e:
        return jsonify({'error': 'CoW quote failed', 'details': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    health_status = {
        'status': 'ok',
        'service': 'hand-smart-order-router',
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
        topic_path = publisher.topic_path(project_id, 'order-routing-events')
        publisher.get_topic(request={'topic': topic_path})
        health_status['gcp_services']['pubsub'] = 'connected'
    except Exception as e:
        health_status['gcp_services']['pubsub'] = f'error: {str(e)}'
        health_status['status'] = 'degraded'

    # Check BigQuery connectivity
    try:
        query = f'SELECT 1 FROM `{project_id}.orders.routing_logs` LIMIT 1'
        bigquery_client.query(query).result()
        health_status['gcp_services']['bigquery'] = 'connected'
    except Exception as e:
        health_status['gcp_services']['bigquery'] = f'error: {str(e)}'
        health_status['status'] = 'degraded'

    return jsonify(health_status)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
