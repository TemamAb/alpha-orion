from flask import Flask, jsonify
from flask_cors import CORS
import os
import json
import threading
import logging
from google.cloud import pubsub_v1
from google.cloud import storage
from google.cloud import bigquery
from google.cloud import bigtable
from google.cloud import secretmanager
import psycopg2
import redis

# Configure GCP Structured Logging
class JsonFormatter(logging.Formatter):
    def format(self, record):
        json_log = {
            "severity": record.levelname,
            "message": record.getMessage(),
            "timestamp": self.formatTime(record, self.datefmt),
            "logger": record.name
        }
        return json.dumps(json_log)

handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
logger = logging.getLogger()
logger.addHandler(handler)
logger.setLevel(logging.INFO)

app = Flask(__name__)
CORS(app)

# GCP Clients
project_id = os.getenv('PROJECT_ID', 'alpha-orion')
subscriber = pubsub_v1.SubscriberClient()
publisher = pubsub_v1.PublisherClient()
storage_client = storage.Client()
bigquery_client = bigquery.Client()
bigtable_client = bigtable.Client(project=project_id)
secret_client = secretmanager.SecretManagerServiceClient()

# Connections
db_conn = None
redis_conn = None

def get_secret(secret_id):
    try:
        name = f"projects/{project_id}/secrets/{secret_id}/versions/latest"
        response = secret_client.access_secret_version(request={"name": name})
        return response.payload.data.decode("UTF-8")
    except Exception as e:
        logger.warning(f"Could not fetch secret {secret_id}: {e}")
        return None

def get_db_connection():
    global db_conn
    if db_conn is None:
        db_url = os.getenv('DATABASE_URL') or get_secret('database-url')
        if not db_url:
            logger.error("DATABASE_URL not found in env or Secret Manager")
            raise Exception("Missing DATABASE_URL")
        db_conn = psycopg2.connect(db_url)
    return db_conn

def get_redis_connection():
    global redis_conn
    if redis_conn is None:
        redis_url = os.getenv('REDIS_URL') or get_secret('redis-url')
        if not redis_url:
            logger.error("REDIS_URL not found in env or Secret Manager")
            raise Exception("Missing REDIS_URL")
        redis_conn = redis.from_url(redis_url)
    return redis_conn

def callback(message):
    try:
        data = json.loads(message.data.decode('utf-8'))
        # Process opportunity
        processed_data = data.copy()
        processed_data['processed'] = True
        processed_data['riskAssessment'] = 'Approved' if data['riskLevel'] == 'Low' else 'Review'

        # Publish to processed-opportunities-us
        topic_path = publisher.topic_path(project_id, 'processed-opportunities-us')
        publisher.publish(topic_path, json.dumps(processed_data).encode('utf-8'))

        # Store in BigQuery
        dataset_id = 'flash_loan_historical_data'
        table_id = 'processed_opportunities'
        table_ref = bigquery_client.dataset(dataset_id).table(table_id)
        bigquery_client.insert_rows_json(table_ref, [processed_data])

        message.ack()
    except Exception as e:
        logger.error(f"Processing error: {e}")
        message.nack()

# Start subscriber in background
def start_subscriber():
    subscription_path = subscriber.subscription_path(project_id, 'raw-opportunities-sub')
    subscriber.subscribe(subscription_path, callback=callback)

threading.Thread(target=start_subscriber, daemon=True).start()

@app.route('/orchestrate', methods=['POST'])
def orchestrate():
    # Mock orchestration
    return jsonify({'message': 'Orchestration started', 'status': 'running'})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
