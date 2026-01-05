# Arbitrage Flash Loan Backend - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Arbitrage Flash Loan Backend to production environments.

## Prerequisites

- AWS CLI configured with appropriate permissions
- Docker and Docker Compose installed
- Node.js 18+ installed
- Git repository access

## Quick Start (Automated)

### 1. AWS Infrastructure Setup

Run the automated setup script:

```bash
cd backend/deploy
chmod +x aws-setup.sh
./aws-setup.sh
```

This script will create:
- ECR repository for container images
- ECS cluster and service
- Application Load Balancer
- CloudWatch log groups
- Required IAM roles

### 2. Configure Secrets

Create secrets in AWS Secrets Manager:

```bash
# MongoDB Connection
aws secretsmanager create-secret \
  --name arbitrage/mongodb-uri \
  --secret-string '{"MONGODB_URI":"mongodb://username:password@host:27017/arbitrage_prod"}'

# Redis Connection
aws secretsmanager create-secret \
  --name arbitrage/redis-url \
  --secret-string '{"REDIS_URL":"redis://username:password@host:6379"}'

# API Keys
aws secretsmanager create-secret \
  --name arbitrage/gemini-api-key \
  --secret-string '{"GEMINI_API_KEY":"your-gemini-api-key"}'

aws secretsmanager create-secret \
  --name arbitrage/jwt-secret \
  --secret-string '{"JWT_SECRET":"your-256-bit-jwt-secret"}'

aws secretsmanager create-secret \
  --name arbitrage/api-key \
  --secret-string '{"API_KEY":"your-production-api-key"}'

# Blockchain
aws secretsmanager create-secret \
  --name arbitrage/infura-project-id \
  --secret-string '{"INFURA_PROJECT_ID":"your-infura-project-id"}'

aws secretsmanager create-secret \
  --name arbitrage/private-key \
  --secret-string '{"PRIVATE_KEY":"your-wallet-private-key"}'
```

### 3. Build and Deploy

The CI/CD pipeline will automatically:
1. Run tests on every push
2. Build Docker image on successful tests
3. Deploy to staging environment
4. Require manual approval for production deployment

To trigger production deployment, commit with `[deploy-prod]` in the message:

```bash
git commit -m "feat: add new arbitrage strategy [deploy-prod]"
git push origin main
```

## Manual Deployment

### Local Development

1. Copy environment file:
```bash
cp .env.example .env.local
```

2. Update `.env.local` with your local configuration

3. Start services:
```bash
docker-compose up -d
```

### Staging Environment

1. Update `docker-compose.staging.yml` with your configuration

2. Deploy to staging:
```bash
docker-compose -f docker-compose.staging.yml up -d
```

### Production Environment

1. Build and push Docker image:
```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URI

# Build and tag
docker build -t arbitrage-backend .
docker tag arbitrage-backend:latest YOUR_ECR_URI/arbitrage-backend:latest

# Push
docker push YOUR_ECR_URI/arbitrage-backend:latest
```

2. Update ECS service:
```bash
aws ecs update-service \
  --cluster arbitrage-production \
  --service arbitrage-backend-service \
  --force-new-deployment
```

## Monitoring Setup

### Grafana Dashboard

1. Import the dashboard from `monitoring/grafana-dashboard.json`

2. Configure Prometheus data source pointing to your Prometheus instance

3. The dashboard includes:
   - API response times and request rates
   - Flash loan success rates
   - System resource usage
   - Database connection metrics
   - Error rates and cache hit rates

### Alerting Rules

Configure alerts in Prometheus for:
- High error rates (>5%)
- Low flash loan success rate (<90%)
- High memory/CPU usage (>80%)
- Database connection issues

## Security Configuration

### SSL/TLS Setup

1. Obtain SSL certificate (Let's Encrypt or AWS ACM)

2. Update Nginx configuration in `nginx/nginx.conf`:
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ... rest of SSL config
}
```

3. Update ALB listener to redirect HTTP to HTTPS

### Network Security

- ALB security group: Allow 80/443 from 0.0.0.0/0
- ECS tasks: Allow inbound from ALB security group only
- Database: Restrict to VPC/subnet access only

## Backup and Recovery

### Database Backups

Automated backups are configured via MongoDB Atlas or AWS Backup.

### Application Backups

- Configuration files backed up via Git
- Docker images immutable and versioned in ECR
- Logs streamed to CloudWatch with retention policies

### Disaster Recovery

1. **RTO (Recovery Time Objective)**: 1 hour
2. **RPO (Recovery Point Objective)**: 15 minutes
3. Multi-region deployment capability
4. Automated failover procedures

## Performance Optimization

### Scaling

- **Horizontal Scaling**: Increase desired count in ECS service
- **Vertical Scaling**: Update CPU/memory in task definition
- **Auto Scaling**: Configure based on CPU/memory metrics

### Caching Strategy

- Redis for session and API response caching
- CDN for static assets (if applicable)
- Database query result caching

### Monitoring Thresholds

- CPU > 70%: Scale up
- Memory > 80%: Scale up
- Response time > 500ms: Alert
- Error rate > 5%: Alert

## Troubleshooting

### Common Issues

1. **Service fails to start**
   - Check CloudWatch logs
   - Verify environment variables
   - Confirm database connectivity

2. **High latency**
   - Check database performance
   - Monitor Redis cache hit rate
   - Review application logs for bottlenecks

3. **Deployment failures**
   - Verify ECR permissions
   - Check task definition syntax
   - Review ECS service events

### Health Checks

- `/api/health`: Application health
- `/api/metrics`: Prometheus metrics
- ECS health checks: Container health
- ALB target health: Load balancer health

## Maintenance

### Regular Tasks

- **Weekly**: Review logs and metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Performance optimization and scaling review

### Updates

1. Test changes in staging environment
2. Update infrastructure as code
3. Deploy via CI/CD pipeline
4. Monitor post-deployment metrics

## Support

For issues or questions:
- Check application logs in CloudWatch
- Review Grafana dashboards
- Contact DevOps team
- Review this documentation

---

**Last Updated**: December 2024
**Version**: 1.0.0
