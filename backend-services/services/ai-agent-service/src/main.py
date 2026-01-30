from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, get_jwt
from flask_talisman import Talisman
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

# Security headers
Talisman(app, content_security_policy={
    'default-src': "'self'",
    'style-src': "'self' 'unsafe-inline'",
    'script-src': "'self'",
    'img-src': "'self' data: https:",
}, force_https=True, strict_transport_security=True, strict_transport_security_preload=True)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRE_MINUTES'] = 15
app.config['JWT_REFRESH_TOKEN_EXPIRE_DAYS'] = 30
jwt = JWTManager(app)

# GCP Logging Client for audit logging
logging_client = cloud_logging.Client()
logger = logging_client.logger('ai-agent-service-audit')

# Role-based access control decorator
def role_required(required_role):
    def decorator(func):
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role', 'user')
            if user_role not in required_role:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return func(*args, **kwargs)
        wrapper.__name__ = func.__name__
        return wrapper
    return decorator

# Audit logging helper
def log_audit_event(event_type, user_id, action, details=None):
    logger.log_struct({
        'event_type': event_type,
        'user_id': user_id,
        'action': action,
        'timestamp': json.dumps({'timestamp': {'seconds': int(os.times()[4]), 'nanos': 0}}),
        'service': 'ai-agent-service',
        'details': details or {}
    })

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
            'service': 'ai-agent-service'
        })
        return None

@app.route('/agent', methods=['GET'])
@role_required(['admin', 'trader'])
def agent():
    user_id = get_jwt_identity()
    claims = get_jwt()

    # Audit log the access
    log_audit_event('AGENT_ACCESS', user_id, 'get_agent_actions', {
        'user_role': claims.get('role'),
        'endpoint': '/agent'
    })

    # Mock AI agent actions
    actions = [
        {'action': 'buy', 'asset': 'ETH', 'amount': random.uniform(0.1, 1.0)},
        {'action': 'sell', 'asset': 'USDC', 'amount': random.uniform(100, 1000)}
    ]

    # Log financial actions for audit
    for action in actions:
        log_audit_event('FINANCIAL_ACTION', user_id, action['action'], {
            'asset': action['asset'],
            'amount': action['amount'],
            'service': 'ai-agent-service'
        })

    return jsonify({'actions': actions})

@app.route('/health', methods=['GET'])
def health():
    health_status = {
        'status': 'ok',
        'service': 'ai-agent-service',
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
        topic_path = publisher.topic_path(project_id, 'agent-actions')
        # Just check if we can get topic info
        publisher.get_topic(request={'topic': topic_path})
        health_status['gcp_services']['pubsub'] = 'connected'
    except Exception as e:
        health_status['gcp_services']['pubsub'] = f'error: {str(e)}'
        health_status['status'] = 'degraded'

    # Check BigQuery connectivity
    try:
        # Simple query to check connectivity
        query = f'SELECT 1 FROM `{project_id}.arbitrage.agent_decisions` LIMIT 1'
        bigquery_client.query(query).result()
        health_status['gcp_services']['bigquery'] = 'connected'
    except Exception as e:
        health_status['gcp_services']['bigquery'] = f'error: {str(e)}'
        health_status['status'] = 'degraded'

    return jsonify(health_status)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
