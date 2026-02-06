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
from google.cloud import logging as cloud_logging
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

# Connections
db_conn = None
redis_conn = None

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

@app.route('/simulate', methods=['GET'])
def simulate():
    mode = get_system_mode()

    if mode == 'live':
        # No simulation in live mode
        return jsonify({'error': 'Simulation disabled in live mode'}), 403

    # For sim mode, use real blockchain data for simulation
    try:
        # This would integrate with real market data and strategy engine
        # For now, use more realistic simulation based on real data patterns
        import requests
        # Call blockchain proxy for real data
        proxy_response = requests.get('http://localhost:8081/proxy')  # Assuming hand-blockchain-proxy runs on 8081
        if proxy_response.status_code == 200:
            blockchain_data = proxy_response.json()
            # Use real blockchain metrics to inform simulation
            gas_price = blockchain_data.get('gasPrice', 50)
            # Simulate based on gas prices and market conditions
            if gas_price > 80:
                scenario = 'High Gas Environment'
                outcome = random.choice(['Profit', 'Loss', 'Break Even'])
                pnl = random.uniform(-500, 2000)  # Higher potential in high gas
            else:
                scenario = 'Normal Market Conditions'
                outcome = random.choice(['Profit', 'Loss', 'Break Even'])
                pnl = random.uniform(-1000, 1000)
            confidence = random.uniform(0.5, 0.95)
        else:
            # Fallback if proxy fails
            scenario = 'Market Analysis'
            outcome = random.choice(['Profit', 'Loss', 'Break Even'])
            pnl = random.uniform(-1000, 1000)
            confidence = random.uniform(0.5, 0.95)
    except Exception as e:
        # Fallback simulation
        scenario = 'Market Analysis'
        outcome = random.choice(['Profit', 'Loss', 'Break Even'])
        pnl = random.uniform(-1000, 1000)
        confidence = random.uniform(0.5, 0.95)

    simulation = {
        'scenario': scenario,
        'outcome': outcome,
        'pnl': pnl,
        'confidence': confidence
    }

    # Publish simulation result to Pub/Sub
    topic_path = publisher.topic_path(project_id, 'simulation-results')
    data = json.dumps(simulation).encode('utf-8')
    publisher.publish(topic_path, data)

    # Log to BigQuery
    table_id = f'{project_id}.simulation.simulation_logs'
    rows_to_insert = [{
        'timestamp': json.dumps({'timestamp': {'seconds': int(os.times()[4]), 'nanos': 0}}),
        'service': 'brain-simulation',
        'event_type': 'simulation_completed',
        'data': json.dumps(simulation)
    }]
    bigquery_client.insert_rows_json(table_id, rows_to_insert)

    return jsonify(simulation)

@app.route('/health', methods=['GET'])
def health():
    health_status = {
        'status': 'ok',
        'service': 'brain-simulation',
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
        topic_path = publisher.topic_path(project_id, 'simulation-results')
        # Just check if we can get topic info
        publisher.get_topic(request={'topic': topic_path})
        health_status['gcp_services']['pubsub'] = 'connected'
    except Exception as e:
        health_status['gcp_services']['pubsub'] = f'error: {str(e)}'
        health_status['status'] = 'degraded'

    # Check BigQuery connectivity
    try:
        # Simple query to check connectivity
        query = f'SELECT 1 FROM `{project_id}.simulation.simulation_logs` LIMIT 1'
        bigquery_client.query(query).result()
        health_status['gcp_services']['bigquery'] = 'connected'
    except Exception as e:
        health_status['gcp_services']['bigquery'] = f'error: {str(e)}'
        health_status['status'] = 'degraded'

    return jsonify(health_status)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
