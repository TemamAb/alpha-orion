from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
import threading
import logging
from google.cloud import pubsub
from google.cloud import storage
from google.cloud import bigquery
from google.cloud import bigtable
from google.cloud import secretmanager
import psycopg2
import redis
import datetime
import jwt
import hashlib
import secrets

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

JWT_SECRET = get_secret('jwt-secret') or 'default-secret-key'
USERS = {
    'admin': {'password': hashlib.sha256('admin123'.encode()).hexdigest(), 'role': 'admin'},
    'user': {'password': hashlib.sha256('user123'.encode()).hexdigest(), 'role': 'user'}
}

def generate_token(username, role):
    payload = {
        'username': username,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid token'}), 401
        token = auth_header.split(' ')[1]
        user = verify_token(token)
        if not user:
            return jsonify({'error': 'Invalid token'}), 401
        request.user = user
        # Audit log
        logger.info(f"User {user['username']} accessed {request.path}")
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

def require_role(role):
    def decorator(f):
        def wrapper(*args, **kwargs):
            if not hasattr(request, 'user') or request.user['role'] != role:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

# GCP Clients
project_id = os.getenv('PROJECT_ID', 'alpha-orion')
subscriber = pubsub.SubscriberClient()
publisher = pubsub.PublisherClient()
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

def get_system_mode():
    redis_conn = get_redis_connection()
    mode = redis_conn.get('system_mode')
    return mode.decode('utf-8') if mode else 'sim'  # default to sim

def set_system_mode(mode):
    if mode not in ['sim', 'live']:
        raise ValueError("Invalid mode. Must be 'sim' or 'live'")
    redis_conn = get_redis_connection()
    redis_conn.set('system_mode', mode)
    # Publish mode change notification
    topic_path = publisher.topic_path(project_id, 'mode-changes')
    publisher.publish(topic_path, json.dumps({'mode': mode, 'timestamp': str(datetime.datetime.utcnow())}).encode('utf-8'))
    logger.info(f"System mode switched to {mode}")

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

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if username in USERS and USERS[username]['password'] == hashlib.sha256(password.encode()).hexdigest():
        token = generate_token(username, USERS[username]['role'])
        logger.info(f"User {username} logged in")
        return jsonify({'token': token, 'role': USERS[username]['role']})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/auth/refresh', methods=['POST'])
@require_auth
def refresh():
    user = request.user
    token = generate_token(user['username'], user['role'])
    return jsonify({'token': token})

@app.route('/mode/status', methods=['GET'])
def mode_status():
    mode = get_system_mode()
    # Get metrics - for now, mock zero-initialized
    metrics = {'pnl': 0, 'trades': 0, 'win_rate': 0} if mode == 'sim' else {'pnl': 1000, 'trades': 50, 'win_rate': 0.8}  # mock live metrics
    return jsonify({'mode': mode, 'metrics': metrics})

@app.route('/mode/validate', methods=['POST'])
@require_auth
def mode_validate():
    # Pre-flight checks
    # For now, basic checks
    mode = get_system_mode()
    checks = {
        'database_connected': db_conn is not None,
        'redis_connected': redis_conn is not None,
        'current_mode': mode
    }
    valid = all(checks.values())
    return jsonify({'valid': valid, 'checks': checks})

@app.route('/mode/switch', methods=['POST'])
@require_auth
@require_role('admin')
def mode_switch():
    data = request.get_json()
    new_mode = data.get('mode')
    confirmation = data.get('confirmation', False)
    if not confirmation:
        return jsonify({'error': 'Confirmation required'}), 400
    try:
        set_system_mode(new_mode)
        # Zero metrics if switching to sim
        if new_mode == 'sim':
            redis_conn = get_redis_connection()
            redis_conn.set('pnl', 0)
            redis_conn.set('trades', 0)
            redis_conn.set('win_rate', 0)
        return jsonify({'message': f'Mode switched to {new_mode}'})
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@app.route('/compliance/audit', methods=['GET'])
@require_auth
@require_role('admin')
def audit_logs():
    # Mock audit logs
    logs = [
        {'timestamp': '2023-01-01T00:00:00Z', 'user': 'admin', 'action': 'mode_switch', 'details': 'Switched to live'},
        {'timestamp': '2023-01-01T01:00:00Z', 'user': 'user', 'action': 'login', 'details': 'Successful login'}
    ]
    return jsonify({'logs': logs})

@app.route('/compliance/report', methods=['GET'])
@require_auth
@require_role('admin')
def compliance_report():
    # Mock compliance report
    report = {
        'aml_checks': 100,
        'kyc_verifications': 50,
        'audit_trails': 200,
        'status': 'compliant'
    }
    return jsonify(report)

@app.route('/metrics', methods=['GET'])
def metrics():
    # Prometheus metrics
    mode = get_system_mode()
    metrics_text = f"""
# HELP system_mode Current system mode
# TYPE system_mode gauge
system_mode{{mode="{mode}"}} 1

# HELP trading_pnl Current P&L
# TYPE trading_pnl gauge
trading_pnl 1000

# HELP active_trades Number of active trades
# TYPE active_trades gauge
active_trades 5
"""
    return metrics_text, 200, {'Content-Type': 'text/plain'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
