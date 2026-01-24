from flask import Flask, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
import random
import os
import json
from google.cloud import pubsub_v1
from google.cloud import storage
from google.cloud import bigquery
from google.cloud import bigtable
from google.cloud import secretmanager
from sqlalchemy import create_engine
import redis

app = Flask(__name__)
CORS(app)

limiter = Limiter(app, key_func=get_remote_address)
cache = Cache(app, config={'CACHE_TYPE': 'redis', 'CACHE_REDIS_URL': os.getenv('REDIS_URL')})

# GCP Clients
project_id = os.getenv('PROJECT_ID', 'alpha-orion')
publisher = pubsub_v1.PublisherClient()
storage_client = storage.Client()
bigquery_client = bigquery.Client()
bigtable_client = bigtable.Client(project=project_id)
secret_client = secretmanager.SecretManagerServiceClient()

# Connections
db_engine = None
redis_conn = None

def get_db_connection():
    global db_engine
    if db_engine is None:
        db_url = os.getenv('DATABASE_URL')
        db_engine = create_engine(db_url, pool_size=10, max_overflow=20, pool_pre_ping=True)
    return db_engine.raw_connection()

def get_redis_connection():
    global redis_conn
    if redis_conn is None:
        redis_url = os.getenv('REDIS_URL')
        redis_conn = redis.from_url(redis_url)
    return redis_conn

@app.route('/risk', methods=['GET'])
@limiter.limit("100 per minute")
@cache.cached(timeout=300)
def risk():
    # Mock risk management
    assessment = {
        'overallRisk': random.choice(['Low', 'Medium', 'High']),
        'factors': ['Volatility', 'Liquidity', 'Market Conditions'],
        'recommendations': ['Diversify', 'Reduce Leverage']
    }
    return jsonify(assessment)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
