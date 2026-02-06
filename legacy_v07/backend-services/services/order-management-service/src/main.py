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
logger = logging_client.logger('order-management-service')

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
            'service': 'order-management-service'
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

@app.route('/orders', methods=['GET'])
def orders():
    # Get real orders from database
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, type, asset, amount, status FROM orders ORDER BY created_at DESC")
        orders = cursor.fetchall()
        cursor.close()

        orders_data = {'orders': [{'id': row[0], 'type': row[1], 'asset': row[2], 'amount': row[3], 'status': row[4]} for row in orders]}

        # Publish order query event to Pub/Sub
        topic_path = publisher.topic_path(project_id, 'order-events')
        event_data = json.dumps({'event_type': 'orders_queried', 'count': len(orders)}).encode('utf-8')
        publisher.publish(topic_path, event_data)

        # Log to BigQuery
        table_id = f'{project_id}.orders.order_logs'
        rows_to_insert = [{
            'timestamp': json.dumps({'timestamp': {'seconds': int(os.times()[4]), 'nanos': 0}}),
            'service': 'order-management-service',
            'event_type': 'orders_queried',
            'data': json.dumps({'count': len(orders)})
        }]
        bigquery_client.insert_rows_json(table_id, rows_to_insert)

        return jsonify(orders_data)
    except Exception as e:
        return jsonify({'error': 'Failed to fetch orders', 'details': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    health_status = {
        'status': 'ok',
        'service': 'order-management-service',
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
        topic_path = publisher.topic_path(project_id, 'order-events')
        publisher.get_topic(request={'topic': topic_path})
        health_status['gcp_services']['pubsub'] = 'connected'
    except Exception as e:
        health_status['gcp_services']['pubsub'] = f'error: {str(e)}'
        health_status['status'] = 'degraded'

    # Check BigQuery connectivity
    try:
        query = f'SELECT 1 FROM `{project_id}.orders.order_logs` LIMIT 1'
        bigquery_client.query(query).result()
        health_status['gcp_services']['bigquery'] = 'connected'
    except Exception as e:
        health_status['gcp_services']['bigquery'] = f'error: {str(e)}'
        health_status['status'] = 'degraded'

    return jsonify(health_status)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
