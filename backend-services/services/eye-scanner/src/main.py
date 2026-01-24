from flask import Flask, jsonify
from flask_cors import CORS
import random
import logging
import time
import os
import json
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

@app.route('/scan', methods=['GET'])
def scan():
    logger.info("Starting market scan")
    # Mock scanning for opportunities
    opportunities = []
    for i in range(random.randint(1, 5)):
        opp = {
            'id': f'opp-{int(time.time())}-{i}',
            'assets': ['ETH', 'USDC'],
            'exchanges': ['Uniswap', 'Sushiswap'],
            'potentialProfit': random.uniform(50, 1500),
            'riskLevel': random.choice(['Low', 'Medium', 'High']),
            'timestamp': int(time.time() * 1000)
        }
        opportunities.append(opp)

    # GCP Integrations
    try:
        # Publish to Pub/Sub
        topic_path = publisher.topic_path(project_id, 'raw-opportunities')
        for opp in opportunities:
            data = json.dumps(opp).encode('utf-8')
            publisher.publish(topic_path, data)

        # Store in GCS
        bucket = storage_client.bucket('alpha-orion-market-data-lake')
        blob = bucket.blob(f'opportunities/{int(time.time())}.json')
        blob.upload_from_string(json.dumps(opportunities))

        # Insert into BigQuery
        dataset_id = 'flash_loan_historical_data'
        table_id = 'opportunities'
        table_ref = bigquery_client.dataset(dataset_id).table(table_id)
        rows_to_insert = opportunities
        bigquery_client.insert_rows_json(table_ref, rows_to_insert)

        # Insert into Bigtable
        instance_id = 'flash-loan-bigtable'
        table_id = 'opportunities'
        instance = bigtable_client.instance(instance_id)
        table = instance.table(table_id)
        for opp in opportunities:
            row_key = opp['id']
            row = table.row(row_key)
            row.set_cell('cf1', 'data', json.dumps(opp))
            row.commit()

        # Cache in Redis
        redis_conn = get_redis_connection()
        redis_conn.set('latest_opportunities', json.dumps(opportunities), ex=3600)

    except Exception as e:
        logger.error(f"GCP integration error: {e}")

    return jsonify(opportunities)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
