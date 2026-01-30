from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
import random
import os
import json
import numpy as np
import pandas as pd
from scipy import stats
from datetime import datetime, timedelta
from google.cloud import pubsub_v1
from google.cloud import storage
from google.cloud import bigquery
from google.cloud import bigtable
from google.cloud import secretmanager
from sqlalchemy import create_engine
import redis
from google.cloud import logging as cloud_logging

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

def calculate_var(returns, confidence_level=0.95, time_horizon=1):
    """Calculate Value at Risk using historical simulation"""
    if len(returns) < 30:
        return 0

    # Sort returns in ascending order
    sorted_returns = np.sort(returns)

    # Calculate VaR
    var_index = int((1 - confidence_level) * len(sorted_returns))
    var = sorted_returns[var_index]

    # Scale for time horizon (assuming daily returns)
    if time_horizon > 1:
        var = var * np.sqrt(time_horizon)

    return abs(var)  # Return positive value

def calculate_expected_shortfall(returns, var):
    """Calculate Expected Shortfall (CVaR)"""
    if len(returns) < 30:
        return 0

    # Returns worse than VaR
    tail_returns = returns[returns <= -var]

    if len(tail_returns) == 0:
        return var

    return abs(np.mean(tail_returns))

def calculate_sharpe_ratio(returns, risk_free_rate=0.02):
    """Calculate Sharpe ratio"""
    if len(returns) < 2 or np.std(returns) == 0:
        return 0

    excess_returns = returns - risk_free_rate/365  # Daily risk-free rate
    return np.mean(excess_returns) / np.std(excess_returns)

def calculate_max_drawdown(price_series):
    """Calculate maximum drawdown"""
    if len(price_series) < 2:
        return 0

    peak = price_series[0]
    max_drawdown = 0

    for price in price_series:
        if price > peak:
            peak = price
        drawdown = (peak - price) / peak
        max_drawdown = max(max_drawdown, drawdown)

    return max_drawdown

def get_portfolio_risk_metrics():
    """Calculate comprehensive portfolio risk metrics"""
    try:
        # Get historical trade data
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get PnL data for last 30 days
        cursor.execute("""
            SELECT pnl, timestamp
            FROM trade_history
            WHERE timestamp >= NOW() - INTERVAL '30 days'
            ORDER BY timestamp ASC
        """)
        pnl_data = cursor.fetchall()

        if len(pnl_data) < 10:
            return get_default_risk_metrics()

        pnl_values = [row[0] for row in pnl_data]
        returns = np.array(pnl_values)

        # Calculate risk metrics
        var_95 = calculate_var(returns, 0.95)
        var_99 = calculate_var(returns, 0.99)
        es_95 = calculate_expected_shortfall(returns, var_95)
        sharpe = calculate_sharpe_ratio(returns)
        max_dd = calculate_max_drawdown(np.cumsum(returns))

        # Current exposure
        cursor.execute("""
            SELECT SUM(position_size * current_price) as total_exposure
            FROM positions
            WHERE status = 'open'
        """)
        exposure_result = cursor.fetchone()
        current_exposure = exposure_result[0] if exposure_result and exposure_result[0] else 0

        cursor.close()

        return {
            'var_95': var_95,
            'var_99': var_99,
            'expected_shortfall_95': es_95,
            'sharpe_ratio': sharpe,
            'max_drawdown': max_dd,
            'current_exposure': current_exposure,
            'volatility': np.std(returns),
            'total_trades': len(returns),
            'win_rate': len([r for r in returns if r > 0]) / len(returns) if len(returns) > 0 else 0
        }

    except Exception as e:
        print(f"Risk calculation error: {e}")
        return get_default_risk_metrics()

def get_default_risk_metrics():
    """Return default risk metrics when data is unavailable"""
    return {
        'var_95': 0.05,
        'var_99': 0.10,
        'expected_shortfall_95': 0.08,
        'sharpe_ratio': 1.5,
        'max_drawdown': 0.15,
        'current_exposure': 0,
        'volatility': 0.02,
        'total_trades': 0,
        'win_rate': 0.5
    }

def assess_overall_risk(risk_metrics):
    """Assess overall portfolio risk level"""
    risk_score = 0

    # VaR 95% > 5% of portfolio
    if risk_metrics['var_95'] > 0.05:
        risk_score += 2

    # Expected Shortfall > 8%
    if risk_metrics['expected_shortfall_95'] > 0.08:
        risk_score += 2

    # Sharpe ratio < 1
    if risk_metrics['sharpe_ratio'] < 1:
        risk_score += 1

    # Max drawdown > 20%
    if risk_metrics['max_drawdown'] > 0.20:
        risk_score += 2

    # High volatility
    if risk_metrics['volatility'] > 0.05:
        risk_score += 1

    if risk_score <= 2:
        return 'Low'
    elif risk_score <= 5:
        return 'Medium'
    else:
        return 'High'

def calculate_market_impact(trade_size, avg_daily_volume, current_price, slippage_model='square_root'):
    """Calculate market impact for large trades"""
    if avg_daily_volume <= 0:
        return 0

    # Trade size as percentage of daily volume
    participation_rate = trade_size / avg_daily_volume

    if slippage_model == 'square_root':
        # Square root model: impact ∝ √(participation_rate)
        impact = 0.1 * np.sqrt(participation_rate)  # 10 basis points base impact
    elif slippage_model == 'linear':
        # Linear model: impact ∝ participation_rate
        impact = 0.05 * participation_rate
    else:
        # Exponential model for very large trades
        impact = 0.01 * np.exp(participation_rate * 2)

    # Adjust for current market conditions (simplified)
    volatility_adjustment = np.random.uniform(0.8, 1.2)  # Market volatility factor
    impact *= volatility_adjustment

    return min(impact, 0.5)  # Cap at 50% impact

def calculate_optimal_position_size(capital, win_rate, avg_win, avg_loss, risk_per_trade=0.02):
    """Calculate optimal position size using Kelly Criterion"""
    if win_rate <= 0 or win_rate >= 1 or avg_loss == 0:
        return capital * 0.01  # Conservative fallback

    # Kelly Criterion: f = (bp - q) / b
    # where b = odds (avg_win/avg_loss), p = win_rate, q = loss_rate
    b = avg_win / avg_loss
    kelly_fraction = (win_rate * b - (1 - win_rate)) / b

    # Apply risk management constraints
    kelly_fraction = max(0, min(kelly_fraction, 0.25))  # Cap at 25%

    # Use half-Kelly for safety
    optimal_size = capital * kelly_fraction * 0.5

    # Apply maximum risk per trade limit
    max_risk_amount = capital * risk_per_trade
    risk_constrained_size = max_risk_amount / (avg_loss * (1 - win_rate))

    return min(optimal_size, risk_constrained_size)

def calculate_risk_parity_weights(assets, covariance_matrix, target_risk):
    """Calculate risk parity portfolio weights"""
    n_assets = len(assets)

    if n_assets == 0 or covariance_matrix is None:
        return {asset: 1.0/n_assets for asset in assets}

    # Risk parity: equal risk contribution from each asset
    try:
        # Simplified risk parity calculation
        volatilities = np.sqrt(np.diag(covariance_matrix))
        inv_volatilities = 1.0 / volatilities

        # Normalize weights
        weights = inv_volatilities / np.sum(inv_volatilities)

        # Scale to target risk level
        portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(covariance_matrix, weights)))
        if portfolio_volatility > 0:
            weights *= target_risk / portfolio_volatility

        return dict(zip(assets, weights))

    except:
        # Fallback to equal weighting
        return {asset: 1.0/n_assets for asset in assets}

def calculate_beta(asset_returns, market_returns):
    """Calculate beta relative to market"""
    if len(asset_returns) < 10 or len(market_returns) < 10:
        return 1.0

    try:
        covariance = np.cov(asset_returns, market_returns)[0, 1]
        market_variance = np.var(market_returns)

        if market_variance == 0:
            return 1.0

        return covariance / market_variance

    except:
        return 1.0

def assess_liquidity_risk(position_size, avg_daily_volume, bid_ask_spread):
    """Assess liquidity risk for a position"""
    if avg_daily_volume <= 0:
        return 'High'

    # Turnover ratio (how many days to liquidate position)
    turnover_ratio = position_size / avg_daily_volume

    # Spread cost
    spread_cost = bid_ask_spread / 2  # Half-spread as transaction cost

    risk_score = 0

    if turnover_ratio > 1:  # Takes more than 1 day to liquidate
        risk_score += 2
    elif turnover_ratio > 0.1:  # Takes more than 10% of daily volume
        risk_score += 1

    if spread_cost > 0.005:  # Spread > 50 basis points
        risk_score += 2
    elif spread_cost > 0.002:  # Spread > 20 basis points
        risk_score += 1

    if risk_score <= 1:
        return 'Low'
    elif risk_score <= 3:
        return 'Medium'
    else:
        return 'High'

def monitor_large_positions():
    """Monitor positions for risk thresholds and generate alerts"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get all open positions
        cursor.execute("""
            SELECT
                position_id,
                token_pair,
                position_size,
                entry_price,
                current_price,
                unrealized_pnl,
                timestamp
            FROM positions
            WHERE status = 'open'
            ORDER BY position_size DESC
        """)

        positions = cursor.fetchall()
        alerts = []

        for position in positions:
            position_id, token_pair, size, entry_price, current_price, pnl, timestamp = position

            # Calculate position metrics
            position_value = size * current_price
            pnl_percentage = (pnl / (size * entry_price)) if (size * entry_price) > 0 else 0

            # Risk thresholds
            large_position_threshold = 100000  # $100K
            high_pnl_threshold = 0.10  # 10%
            low_pnl_threshold = -0.05  # -5%

            if position_value > large_position_threshold:
                alerts.append({
                    'type': 'large_position',
                    'position_id': position_id,
                    'token_pair': token_pair,
                    'position_value': position_value,
                    'threshold': large_position_threshold,
                    'severity': 'Medium',
                    'message': f'Large position detected: ${position_value:,.0f} in {token_pair}'
                })

            if pnl_percentage > high_pnl_threshold:
                alerts.append({
                    'type': 'high_pnl',
                    'position_id': position_id,
                    'token_pair': token_pair,
                    'pnl_percentage': pnl_percentage,
                    'threshold': high_pnl_threshold,
                    'severity': 'Low',
                    'message': f'High P&L position: {pnl_percentage:.1%} in {token_pair}'
                })

            if pnl_percentage < low_pnl_threshold:
                alerts.append({
                    'type': 'low_pnl',
                    'position_id': position_id,
                    'token_pair': token_pair,
                    'pnl_percentage': pnl_percentage,
                    'threshold': low_pnl_threshold,
                    'severity': 'High',
                    'message': f'Loss position: {pnl_percentage:.1%} in {token_pair}'
                })

        cursor.close()
        return alerts

    except Exception as e:
        print(f"Position monitoring error: {e}")
        return []

@app.route('/risk', methods=['GET'])
@limiter.limit("100 per minute")
@cache.cached(timeout=300)
def risk():
    risk_metrics = get_portfolio_risk_metrics()
    overall_risk = assess_overall_risk(risk_metrics)

    # Generate risk factors based on metrics
    factors = []
    recommendations = []

    if risk_metrics['var_95'] > 0.05:
        factors.append('High Value at Risk')
        recommendations.append('Reduce position sizes')

    if risk_metrics['volatility'] > 0.05:
        factors.append('High Portfolio Volatility')
        recommendations.append('Implement hedging strategies')

    if risk_metrics['max_drawdown'] > 0.20:
        factors.append('Significant Drawdown')
        recommendations.append('Consider portfolio rebalancing')

    if risk_metrics['sharpe_ratio'] < 1:
        factors.append('Poor Risk-Adjusted Returns')
        recommendations.append('Review strategy parameters')

    if len(factors) == 0:
        factors.append('Market Volatility')
        recommendations.append('Monitor market conditions')

    assessment = {
        'overallRisk': overall_risk,
        'riskMetrics': risk_metrics,
        'factors': factors,
        'recommendations': recommendations,
        'lastUpdated': datetime.utcnow().isoformat()
    }

    return jsonify(assessment)

@app.route('/risk/stress-test', methods=['POST'])
def stress_test():
    """Run stress test scenarios"""
    data = request.get_json()
    scenario = data.get('scenario', 'market_crash')

    # Define stress test scenarios
    scenarios = {
        'market_crash': {'eth_drop': 0.30, 'btc_drop': 0.25, 'gas_spike': 5.0},
        'high_volatility': {'eth_volatility': 0.10, 'btc_volatility': 0.08},
        'liquidity_crisis': {'impermanent_loss': 0.15, 'gas_spike': 3.0},
        'flash_crash': {'eth_drop': 0.50, 'recovery_time': 300}  # 5 minutes
    }

    if scenario not in scenarios:
        return jsonify({'error': 'Invalid scenario'}), 400

    # Run stress test calculation
    base_metrics = get_portfolio_risk_metrics()
    stress_params = scenarios[scenario]

    # Calculate stressed VaR
    stressed_var = base_metrics['var_95'] * (1 + stress_params.get('eth_drop', 0))

    stress_result = {
        'scenario': scenario,
        'base_var_95': base_metrics['var_95'],
        'stressed_var_95': stressed_var,
        'var_increase': ((stressed_var - base_metrics['var_95']) / base_metrics['var_95']) * 100,
        'survival_probability': max(0, 100 - (stressed_var * 100)),
        'recommendations': generate_stress_recommendations(scenario, stress_params)
    }

    return jsonify(stress_result)

def generate_stress_recommendations(scenario, params):
    """Generate recommendations based on stress test results"""
    recommendations = []

    if scenario == 'market_crash':
        recommendations.extend([
            'Implement stop-loss orders',
            'Reduce leverage by 50%',
            'Increase cash reserves',
            'Consider delta-hedging'
        ])
    elif scenario == 'high_volatility':
        recommendations.extend([
            'Tighten position sizing',
            'Use options for volatility hedging',
            'Reduce holding periods',
            'Monitor correlation changes'
        ])
    elif scenario == 'liquidity_crisis':
        recommendations.extend([
            'Avoid large trades',
            'Use decentralized exchanges with better liquidity',
            'Implement slippage controls',
            'Monitor gas prices closely'
        ])

    return recommendations

@app.route('/risk/monitor', methods=['GET'])
@limiter.limit("30 per minute")
def risk_monitor():
    """Real-time risk monitoring for large positions"""
    alerts = monitor_large_positions()

    # Get current risk metrics
    risk_metrics = get_portfolio_risk_metrics()
    overall_risk = assess_overall_risk(risk_metrics)

    # Check for portfolio-level alerts
    if risk_metrics['var_95'] > 0.08:  # 8% VaR threshold
        alerts.append({
            'type': 'portfolio_var',
            'severity': 'High',
            'message': f'Portfolio VaR exceeded threshold: {risk_metrics["var_95"]:.1%}',
            'metric': 'var_95',
            'value': risk_metrics['var_95'],
            'threshold': 0.08
        })

    if risk_metrics['max_drawdown'] > 0.25:  # 25% drawdown threshold
        alerts.append({
            'type': 'portfolio_drawdown',
            'severity': 'Critical',
            'message': f'Portfolio drawdown exceeded threshold: {risk_metrics["max_drawdown"]:.1%}',
            'metric': 'max_drawdown',
            'value': risk_metrics['max_drawdown'],
            'threshold': 0.25
        })

    return jsonify({
        'alerts': alerts,
        'alert_count': len(alerts),
        'risk_level': overall_risk,
        'last_check': datetime.utcnow().isoformat(),
        'monitoring_active': True
    })

@app.route('/risk/market-impact', methods=['POST'])
@limiter.limit("50 per minute")
def market_impact_analysis():
    """Analyze market impact for large trades"""
    data = request.get_json()

    trade_size = data.get('trade_size', 0)
    token_pair = data.get('token_pair', '')
    avg_daily_volume = data.get('avg_daily_volume', 1000000)
    current_price = data.get('current_price', 1.0)
    slippage_model = data.get('slippage_model', 'square_root')

    if trade_size <= 0 or avg_daily_volume <= 0:
        return jsonify({'error': 'Invalid trade parameters'}), 400

    # Calculate market impact
    impact_percentage = calculate_market_impact(trade_size, avg_daily_volume, current_price, slippage_model)

    # Calculate slippage cost
    slippage_cost = trade_size * current_price * impact_percentage

    # Estimate execution time based on market conditions
    participation_rate = trade_size / avg_daily_volume
    if participation_rate > 0.1:  # Large trade
        execution_time_minutes = 30 + (participation_rate * 120)  # 30min to 2.5 hours
    elif participation_rate > 0.01:  # Medium trade
        execution_time_minutes = 5 + (participation_rate * 300)  # 5min to 30min
    else:  # Small trade
        execution_time_minutes = 1 + (participation_rate * 60)  # 1min to 5min

    # Risk assessment
    risk_level = 'Low'
    if impact_percentage > 0.05:  # >5% impact
        risk_level = 'High'
    elif impact_percentage > 0.02:  # >2% impact
        risk_level = 'Medium'

    recommendations = []
    if risk_level == 'High':
        recommendations.extend([
            'Split trade into smaller orders',
            'Use time-weighted average price (TWAP) execution',
            'Consider alternative trading venues',
            'Reduce position size by 50%'
        ])
    elif risk_level == 'Medium':
        recommendations.extend([
            'Monitor order book depth',
            'Use limit orders instead of market orders',
            'Consider iceberg orders for large trades'
        ])

    return jsonify({
        'token_pair': token_pair,
        'trade_size': trade_size,
        'market_impact_percentage': impact_percentage,
        'slippage_cost_usd': slippage_cost,
        'estimated_execution_time_minutes': execution_time_minutes,
        'risk_level': risk_level,
        'recommendations': recommendations,
        'participation_rate': participation_rate,
        'slippage_model_used': slippage_model
    })

@app.route('/risk/position-sizing', methods=['POST'])
@limiter.limit("20 per minute")
def position_sizing():
    """Calculate optimal position sizes using advanced algorithms"""
    data = request.get_json()

    capital = data.get('capital', 100000)
    strategy = data.get('strategy', 'arbitrage')
    risk_tolerance = data.get('risk_tolerance', 0.02)  # 2% risk per trade

    # Get historical performance data
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get strategy-specific performance
        cursor.execute("""
            SELECT pnl, strategy_type
            FROM trade_history
            WHERE strategy_type = %s AND timestamp >= NOW() - INTERVAL '90 days'
            ORDER BY timestamp DESC
        """, (strategy,))

        trades = cursor.fetchall()
        cursor.close()

        if len(trades) < 10:
            # Use default parameters if insufficient data
            win_rate = 0.65
            avg_win = 0.03  # 3% average win
            avg_loss = 0.015  # 1.5% average loss
        else:
            pnls = [trade[0] for trade in trades]
            win_rate = len([p for p in pnls if p > 0]) / len(pnls)
            winning_trades = [p for p in pnls if p > 0]
            losing_trades = [abs(p) for p in pnls if p < 0]

            avg_win = np.mean(winning_trades) if winning_trades else 0.03
            avg_loss = np.mean(losing_trades) if losing_trades else 0.015

    except Exception as e:
        # Fallback to conservative defaults
        win_rate = 0.60
        avg_win = 0.025
        avg_loss = 0.0125

    # Calculate position sizes using different methods
    kelly_size = calculate_optimal_position_size(capital, win_rate, avg_win, avg_loss, risk_tolerance)

    # Fixed percentage method (conservative)
    fixed_percentage_size = capital * risk_tolerance

    # Volatility-adjusted size (simplified)
    volatility = np.std([avg_win, avg_loss]) if avg_loss > 0 else 0.02
    vol_adjusted_size = capital * risk_tolerance / (1 + volatility * 2)

    # Risk parity weights (simplified example)
    assets = ['BTC', 'ETH', 'USDC', 'ARB']
    # Mock covariance matrix
    cov_matrix = np.array([
        [0.04, 0.02, 0.01, 0.015],
        [0.02, 0.05, 0.005, 0.02],
        [0.01, 0.005, 0.001, 0.002],
        [0.015, 0.02, 0.002, 0.03]
    ])
    risk_parity_weights = calculate_risk_parity_weights(assets, cov_matrix, risk_tolerance)

    return jsonify({
        'strategy': strategy,
        'capital': capital,
        'risk_tolerance': risk_tolerance,
        'position_sizes': {
            'kelly_criterion': kelly_size,
            'fixed_percentage': fixed_percentage_size,
            'volatility_adjusted': vol_adjusted_size,
            'recommended': min(kelly_size, fixed_percentage_size)  # Conservative approach
        },
        'performance_metrics': {
            'win_rate': win_rate,
            'avg_win': avg_win,
            'avg_loss': avg_loss,
            'profit_factor': (win_rate * avg_win) / ((1 - win_rate) * avg_loss) if avg_loss > 0 else 0
        },
        'risk_parity_weights': risk_parity_weights,
        'calculation_timestamp': datetime.utcnow().isoformat()
    })

@app.route('/risk/advanced-metrics', methods=['GET'])
@limiter.limit("10 per minute")
@cache.cached(timeout=600)  # Cache for 10 minutes
def advanced_risk_metrics():
    """Calculate advanced risk metrics including beta, correlation risk, and liquidity risk"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get asset returns for beta calculation
        cursor.execute("""
            SELECT
                token_pair,
                pnl,
                timestamp
            FROM trade_history
            WHERE timestamp >= NOW() - INTERVAL '30 days'
            ORDER BY token_pair, timestamp
        """)

        data = cursor.fetchall()
        cursor.close()

        if len(data) < 20:
            return jsonify({'error': 'Insufficient data for advanced metrics'}), 400

        # Process data into returns by asset
        asset_returns = {}
        for token_pair, pnl, timestamp in data:
            if token_pair not in asset_returns:
                asset_returns[token_pair] = []
            asset_returns[token_pair].append(pnl)

        # Calculate market returns (simplified as average of all assets)
        all_returns = []
        for returns in asset_returns.values():
            all_returns.extend(returns)
        market_returns = np.array(all_returns)

        # Calculate advanced metrics for each asset
        advanced_metrics = {}
        for asset, returns in asset_returns.items():
            if len(returns) < 10:
                continue

            returns_array = np.array(returns)

            # Beta calculation
            beta = calculate_beta(returns_array, market_returns)

            # Liquidity risk (mock data - would need real volume data)
            avg_daily_volume = np.random.uniform(500000, 5000000)  # Mock volume
            bid_ask_spread = np.random.uniform(0.0001, 0.01)  # Mock spread
            liquidity_risk = assess_liquidity_risk(
                position_size=np.mean(np.abs(returns_array)),
                avg_daily_volume=avg_daily_volume,
                bid_ask_spread=bid_ask_spread
            )

            # Correlation risk (simplified)
            correlations = {}
            for other_asset, other_returns in asset_returns.items():
                if other_asset != asset and len(other_returns) > 5:
                    corr = np.corrcoef(returns_array[:min(len(returns_array), len(other_returns))],
                                      other_returns[:min(len(returns_array), len(other_returns))])[0, 1]
                    correlations[other_asset] = corr if not np.isnan(corr) else 0

            advanced_metrics[asset] = {
                'beta': beta,
                'liquidity_risk': liquidity_risk,
                'correlation_risk': {
                    'max_correlation': max(correlations.values()) if correlations else 0,
                    'avg_correlation': np.mean(list(correlations.values())) if correlations else 0,
                    'correlations': correlations
                },
                'tail_risk': calculate_expected_shortfall(returns_array, calculate_var(returns_array, 0.95)),
                'concentration_risk': len([r for r in returns if abs(r) > np.std(returns) * 2]) / len(returns)
            }

        # Portfolio-level advanced metrics
        portfolio_beta = np.mean([metrics['beta'] for metrics in advanced_metrics.values()])
        portfolio_liquidity_risk = max([metrics['liquidity_risk'] for metrics in advanced_metrics.values()],
                                     key=lambda x: {'Low': 1, 'Medium': 2, 'High': 3}[x])

        return jsonify({
            'portfolio_level': {
                'beta': portfolio_beta,
                'liquidity_risk': portfolio_liquidity_risk,
                'diversification_ratio': len(advanced_metrics) / (1 + portfolio_beta)
            },
            'asset_level': advanced_metrics,
            'calculation_timestamp': datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({'error': f'Advanced metrics calculation failed: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health():
    health_status = {
        'status': 'ok',
        'service': 'brain-risk-management',
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
        topic_path = publisher.topic_path(project_id, 'risk-alerts')
        # Just check if we can get topic info
        publisher.get_topic(request={'topic': topic_path})
        health_status['gcp_services']['pubsub'] = 'connected'
    except Exception as e:
        health_status['gcp_services']['pubsub'] = f'error: {str(e)}'
        health_status['status'] = 'degraded'

    # Check BigQuery connectivity
    try:
        # Simple query to check connectivity
        query = f'SELECT 1 FROM `{project_id}.risk.risk_metrics` LIMIT 1'
        bigquery_client.query(query).result()
        health_status['gcp_services']['bigquery'] = 'connected'
    except Exception as e:
        health_status['gcp_services']['bigquery'] = f'error: {str(e)}'
        health_status['status'] = 'degraded'

    return jsonify(health_status)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
