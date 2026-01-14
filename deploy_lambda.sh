#!/bin/bash

# AWS Lambda Deployment Script for IUT02 Blanket Distribution Backend
# This script packages the FastAPI backend and deploys it to AWS Lambda

set -e  # Exit on error

echo "🚀 Starting AWS Lambda deployment..."

# Configuration
FUNCTION_NAME="iut02-blanket-api"
REGION="ap-southeast-1"
RUNTIME="python3.11"
HANDLER="lambda_handler.handler"
MEMORY_SIZE=256
TIMEOUT=30
ROLE_NAME="iut02-lambda-execution-role"

# GitHub URLs for data (Phase 2 configuration)
EXCEL_URL="https://raw.githubusercontent.com/kahmed25/iut02-blanket/dev/i.02%20blanket%20distribution%202026.xlsx"
IMAGES_BASE_URL="https://raw.githubusercontent.com/kahmed25/iut02-blanket/dev/images"

# Create deployment package directory
echo "📦 Creating deployment package..."
DEPLOY_DIR="lambda_deployment"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install -r backend/requirements.txt --target $DEPLOY_DIR --platform manylinux2014_x86_64 --only-binary=:all: --python-version 3.11

# Copy backend code
echo "📋 Copying backend code..."
cp backend/*.py $DEPLOY_DIR/

# Remove unnecessary files to reduce package size
echo "🧹 Optimizing package size..."
find $DEPLOY_DIR -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
find $DEPLOY_DIR -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find $DEPLOY_DIR -name "*.pyc" -delete 2>/dev/null || true
find $DEPLOY_DIR -name "*.pyo" -delete 2>/dev/null || true
find $DEPLOY_DIR -name "*.dist-info" -type d -exec rm -rf {} + 2>/dev/null || true
find $DEPLOY_DIR -name "*.egg-info" -type d -exec rm -rf {} + 2>/dev/null || true

# Create zip file
echo "🗜️  Creating deployment package..."
cd $DEPLOY_DIR
zip -r ../lambda_deployment.zip . -q
cd ..

echo "📊 Package size: $(du -h lambda_deployment.zip | cut -f1)"

# Check if IAM role exists, if not create it
echo "🔐 Checking IAM role..."
if ! aws iam get-role --role-name $ROLE_NAME --region $REGION 2>/dev/null; then
    echo "Creating IAM role..."
    
    # Create trust policy
    cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    # Create role
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file://trust-policy.json \
        --region $REGION

    # Attach basic Lambda execution policy
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
        --region $REGION

    echo "⏳ Waiting for role to be available..."
    sleep 10
    
    rm trust-policy.json
fi

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --region $REGION --query 'Role.Arn' --output text)
echo "✅ Using IAM Role: $ROLE_ARN"

# Check if Lambda function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null; then
    echo "🔄 Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://lambda_deployment.zip \
        --region $REGION \
        --no-cli-pager

    # Update configuration
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --handler $HANDLER \
        --memory-size $MEMORY_SIZE \
        --timeout $TIMEOUT \
        --environment "Variables={EXCEL_SOURCE_TYPE=url,EXCEL_URL=$EXCEL_URL,IMAGES_SOURCE_TYPE=url,IMAGES_BASE_URL=$IMAGES_BASE_URL,CACHE_EXPIRATION_SECONDS=300}" \
        --region $REGION \
        --no-cli-pager
else
    echo "🆕 Creating new Lambda function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --handler $HANDLER \
        --memory-size $MEMORY_SIZE \
        --timeout $TIMEOUT \
        --role $ROLE_ARN \
        --zip-file fileb://lambda_deployment.zip \
        --environment "Variables={EXCEL_SOURCE_TYPE=url,EXCEL_URL=$EXCEL_URL,IMAGES_SOURCE_TYPE=url,IMAGES_BASE_URL=$IMAGES_BASE_URL,CACHE_EXPIRATION_SECONDS=300}" \
        --region $REGION \
        --no-cli-pager

    echo "⏳ Waiting for function to be active..."
    aws lambda wait function-active --function-name $FUNCTION_NAME --region $REGION
fi

# Cleanup
echo "🧹 Cleaning up..."
rm -rf $DEPLOY_DIR lambda_deployment.zip

# Get function info
echo ""
echo "✅ Lambda function deployed successfully!"
echo ""
echo "📌 Function Details:"
aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.[FunctionName,Runtime,MemorySize,Timeout,LastModified]' --output table --no-cli-pager

echo ""
echo "🌐 Function ARN:"
aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.FunctionArn' --output text

echo ""
echo "✨ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Create API Gateway HTTP API"
echo "2. Configure API Gateway to trigger this Lambda"
echo "3. Test the API endpoint"
