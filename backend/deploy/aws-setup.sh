#!/bin/bash

# AWS Infrastructure Setup Script for Arbitrage Flash Loan App
# This script sets up the required AWS resources for deployment

set -e

# Configuration
REGION="us-east-1"
CLUSTER_NAME="arbitrage-backend"
SERVICE_NAME="arbitrage-backend-service"
REPO_NAME="arbitrage-backend"
ENVIRONMENT="staging"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Setting up AWS Infrastructure for Arbitrage Flash Loan App${NC}"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📍 Using AWS Region: ${REGION}${NC}"

# Create ECR Repository
echo -e "${YELLOW}📦 Creating ECR Repository...${NC}"
if aws ecr describe-repositories --repository-names ${REPO_NAME} --region ${REGION} &> /dev/null; then
    echo -e "${GREEN}✅ ECR Repository '${REPO_NAME}' already exists${NC}"
else
    aws ecr create-repository \
        --repository-name ${REPO_NAME} \
        --region ${REGION} \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256
    echo -e "${GREEN}✅ Created ECR Repository '${REPO_NAME}'${NC}"
fi

# Get ECR Repository URI
REPO_URI=$(aws ecr describe-repositories --repository-names ${REPO_NAME} --region ${REGION} --query 'repositories[0].repositoryUri' --output text)
echo -e "${GREEN}📋 ECR Repository URI: ${REPO_URI}${NC}"

# Create ECS Cluster
echo -e "${YELLOW}🐳 Creating ECS Cluster...${NC}"
if aws ecs describe-clusters --clusters ${CLUSTER_NAME} --region ${REGION} | jq -r '.clusters[0].status' | grep -q "ACTIVE"; then
    echo -e "${GREEN}✅ ECS Cluster '${CLUSTER_NAME}' already exists${NC}"
else
    aws ecs create-cluster \
        --cluster-name ${CLUSTER_NAME} \
        --region ${REGION} \
        --settings name=containerInsights,value=enabled
    echo -e "${GREEN}✅ Created ECS Cluster '${CLUSTER_NAME}'${NC}"
fi

# Create Task Execution Role (if it doesn't exist)
echo -e "${YELLOW}🔐 Setting up IAM Task Execution Role...${NC}"
TASK_EXECUTION_ROLE_ARN=$(aws iam get-role --role-name ecsTaskExecutionRole --query 'Role.Arn' --output text 2>/dev/null || echo "")

if [ -z "$TASK_EXECUTION_ROLE_ARN" ]; then
    aws iam create-role \
        --role-name ecsTaskExecutionRole \
        --assume-role-policy-document '{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }'

    aws iam attach-role-policy \
        --role-name ecsTaskExecutionRole \
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

    TASK_EXECUTION_ROLE_ARN=$(aws iam get-role --role-name ecsTaskExecutionRole --query 'Role.Arn' --output text)
    echo -e "${GREEN}✅ Created ECS Task Execution Role${NC}"
else
    echo -e "${GREEN}✅ ECS Task Execution Role already exists${NC}"
fi

# Create Application Load Balancer
echo -e "${YELLOW}⚖️ Creating Application Load Balancer...${NC}"

# Create VPC and subnets if they don't exist
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text)
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=${VPC_ID}" --query 'Subnets[0:2].SubnetId' --output text | tr '\n' ',' | sed 's/,$//')

# Create Security Group for ALB
ALB_SG=$(aws ec2 create-security-group \
    --group-name arbitrage-alb-sg \
    --description "Security group for Arbitrage ALB" \
    --vpc-id ${VPC_ID} \
    --query 'GroupId' --output text)

aws ec2 authorize-security-group-ingress \
    --group-id ${ALB_SG} \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id ${ALB_SG} \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0

# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name arbitrage-backend-alb \
    --subnets ${SUBNETS} \
    --security-groups ${ALB_SG} \
    --scheme internet-facing \
    --type application \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text)

echo -e "${GREEN}✅ Created Application Load Balancer${NC}"

# Create Target Group
TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
    --name arbitrage-backend-tg \
    --protocol HTTP \
    --port 5000 \
    --vpc-id ${VPC_ID} \
    --health-check-path /api/health \
    --query 'TargetGroups[0].TargetGroupArn' --output text)

echo -e "${GREEN}✅ Created Target Group${NC}"

# Create ALB Listener
aws elbv2 create-listener \
    --load-balancer-arn ${ALB_ARN} \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=${TARGET_GROUP_ARN}

echo -e "${GREEN}✅ Created ALB Listener${NC}"

# Create ECS Task Definition
echo -e "${YELLOW}📋 Creating ECS Task Definition...${NC}"

cat > task-definition.json << EOF
{
    "family": "arbitrage-backend",
    "taskRoleArn": "${TASK_EXECUTION_ROLE_ARN}",
    "executionRoleArn": "${TASK_EXECUTION_ROLE_ARN}",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "256",
    "memory": "512",
    "containerDefinitions": [
        {
            "name": "arbitrage-backend",
            "image": "${REPO_URI}:latest",
            "essential": true,
            "portMappings": [
                {
                    "containerPort": 5000,
                    "protocol": "tcp"
                }
            ],
            "environment": [
                {"name": "NODE_ENV", "value": "${ENVIRONMENT}"},
                {"name": "PORT", "value": "5000"}
            ],
            "secrets": [
                {"name": "MONGODB_URI", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:arbitrage/mongodb-uri"},
                {"name": "REDIS_URL", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:arbitrage/redis-url"},
                {"name": "GEMINI_API_KEY", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:arbitrage/gemini-api-key"},
                {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:arbitrage/jwt-secret"},
                {"name": "API_KEY", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:arbitrage/api-key"},
                {"name": "INFURA_PROJECT_ID", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:arbitrage/infura-project-id"},
                {"name": "PRIVATE_KEY", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:arbitrage/private-key"}
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/arbitrage-backend",
                    "awslogs-region": "${REGION}",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "healthCheck": {
                "command": ["CMD-SHELL", "curl -f http://localhost:5000/api/health || exit 1"],
                "interval": 30,
                "timeout": 5,
                "retries": 3,
                "startPeriod": 60
            }
        }
    ]
}
EOF

aws ecs register-task-definition \
    --cli-input-json file://task-definition.json \
    --region ${REGION}

echo -e "${GREEN}✅ Registered ECS Task Definition${NC}"

# Create CloudWatch Log Group
echo -e "${YELLOW}📊 Creating CloudWatch Log Group...${NC}"
aws logs create-log-group \
    --log-group-name /ecs/arbitrage-backend \
    --region ${REGION} || echo "Log group may already exist"

echo -e "${GREEN}✅ Created CloudWatch Log Group${NC}"

# Create ECS Service
echo -e "${YELLOW}🚀 Creating ECS Service...${NC}"

aws ecs create-service \
    --cluster ${CLUSTER_NAME} \
    --service-name ${SERVICE_NAME} \
    --task-definition arbitrage-backend \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${SUBNETS}],securityGroups=[${ALB_SG}],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=${TARGET_GROUP_ARN},containerName=arbitrage-backend,containerPort=5000" \
    --region ${REGION} \
    --health-check-grace-period-seconds 60

echo -e "${GREEN}✅ Created ECS Service${NC}"

# Clean up temporary files
rm -f task-definition.json

# Output summary
echo -e "${GREEN}
🎉 AWS Infrastructure Setup Complete!

📋 Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ECS Cluster:        ${CLUSTER_NAME}
ECS Service:         ${SERVICE_NAME}
ECR Repository:      ${REPO_URI}
ALB ARN:            ${ALB_ARN}
Target Group ARN:   ${TARGET_GROUP_ARN}
CloudWatch Logs:    /ecs/arbitrage-backend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next Steps:
1. Update the secrets ARNs in task-definition.json with your actual AWS account ID
2. Create the secrets in AWS Secrets Manager
3. Push your Docker image to ECR
4. Update the service with the new task definition
5. Configure your domain and SSL certificate

${NC}"
