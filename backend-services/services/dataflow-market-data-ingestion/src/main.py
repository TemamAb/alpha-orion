import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
import random
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

def create_market_data():
    # Mock market data
    data = {
        'symbol': random.choice(['ETH', 'BTC', 'USDC']),
        'price': random.uniform(100, 5000),
        'volume': random.uniform(1000, 100000),
        'timestamp': int(time.time() * 1000)
    }
    return data

def process_data(data):
    # Simple processing: log the data
    print(f"Processed market data: {data}")
    return data

def run():
    options = PipelineOptions()
    with beam.Pipeline(options=options) as p:
        (p
         | 'CreateData' >> beam.Create([create_market_data() for _ in range(10)])
         | 'ProcessData' >> beam.Map(process_data)
         | 'LogData' >> beam.Map(print)
        )

if __name__ == '__main__':
    run()
