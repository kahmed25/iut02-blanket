#!/bin/bash

# AWS Lambda Deployment Script (S3 Upload for Large Packages)
# This script handles deployment packages larger than 50MB

set -e

echo "🚀 Starting AWS Lambda deployment (S3 method)..."

# Configuration
FUNCTION_NAME="iut02-blanket-api"
REGION="ap-southeast-1"
RUNTIME="python3.11"
HANDLER="lambda_handler.handler"
MEMORY_SIZE=512  # Increased for pandas/numpy
TIMEOUT=30
ROLE_NAME="iut02-lambda-execution-role"
S3_BUCKET="iut02-lambda-deployments"

# GitHub URLs
EXCEL_URL="https://raw.githubusercontent.com/kahmed25/iut02-blanket/dev/i.02%20blanket%20distribution%202026.xlsx"
IMAGES_BASE_URL="https://raw.githubusercontent.com/kahmed25/iut02-blanket/dev/images"

# Create S3 bucket if it doesn't exist
echo "📦 Checking S3 bucket..."
if ! aws s3 ls "s3://$S3_BUCKET" --region $REGION 2>/dev/null; then
    echo "Creating S3 bucket..."
    aws s3 mb "s3://$S3_BUCKET" --region $REGION
fi

# Create deployment package
echo "📦 Creating deployment package..."
DEPLOY_DIR="lambda_deployment"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Install dependencies
echo "📥 Installing Python dependencies (this may take a few minutes)..."
pip install -r backend/requirements.txt --target $DEPLOY_DIR --platform manylinux2014_x86_64 --only-binary=:all: --python-version 3.11 --quiet

# Copy backend code
echo "📋 Copying backend code..."
cp backend/*.py $DEPLOY_DIR/

# Optimize package size
echo "🧹 Optimizing package size..."
cd $DEPLOY_DIR
# Remove test files and caches
find . -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete
find . -name "*.pyo" -delete
# Remove unnecessary dist-info
find . -name "*.dist-info" -type d -exec rm -rf {} + 2>/dev/null || true

# Create zip
echo "🗜️  Creating deployment package..."
zip -r ../lambda_deployment.zip . -q
cd ..

PACKAGE_SIZE=$(du -h lambda_deployment.zip | cut -f1)
echo "📊 Package size: $PACKAGE_SIZE"

# Upload to S3
echo "☁️  Uploading to S3..."
S3_KEY="deployments/lambda_deployment_$(date +%Y%m%d_%H%M%S).zip"
aws s3 cp lambda_deployment.zip "s3://$S3_BUCKET/$S3_KEY" --region $REGION

echo "✅ Uploaded to s3://$S3_BUCKET/$S3_KEY"

# Check/Create IAM role
echo "🔐 Checking IAM role..."
if ! aws iam get-role --role-name $ROLE_NAME 2>/dev/null; then
    echo "Creating IAM role..."
    cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF
    
    aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document file://trust-policy.json
    aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    
    echo "⏳ Waiting for role..."
    sleep 10
    rm trust-policy.json
fi

ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
echo "✅ Using IAM Role: $ROLE_ARN"

# Deploy Lambda
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null; then
    echo "🔄 Updating Lambda function from S3..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --s3-bucket $S3_BUCKET \
        --s3-key $S3_KEY \
        --region $REGION \
        --no-cli-pager
    
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
    echo "🆕 Creating Lambda function from S3..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --handler $HANDLER \
        --memory-size $MEMORY_SIZE \
        --timeout $TIMEOUT \
        --role $ROLE_ARN \
        --code S3Bucket=$S3_BUCKET,S3Key=$S3_KEY \
        --environment "Variables={EXCEL_SOURCE_TYPE=url,EXCEL_URL=$EXCEL_URL,IMAGES_SOURCE_TYPE=url,IMAGES_BASE_URL=$IMAGES_BASE_URL,CACHE_EXPIRATION_SECONDS=300}" \
        --region $REGION \
        --no-cli-pager
    
    echo "⏳ Waiting for function to be active..."
    aws lambda wait function-active --function-name $FUNCTION_NAME --region $REGION
fi

# Cleanup
echo "🧹 Cleaning up..."
rm -rf $DEPLOY_DIR lambda_deployment.zip

# Show details
echo ""
echo "✅ Lambda function deployed successfully!"
echo ""
aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.[FunctionName,Runtime,MemorySize,Timeout,CodeSize]' --output table --no-cli-pager

echo ""
echo "🌐 Function ARN:"
aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.FunctionArn' --output text

echo ""
echo "✨ Next: Create API Gateway HTTP API"
