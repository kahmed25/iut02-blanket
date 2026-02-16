#!/bin/bash

# Phase 10: AWS Lambda Deployment Script for IUT02 Fund Management Backend
# Includes auth, fund management, media, and distributions modules

set -e  # Exit on error

echo "🚀 Starting AWS Lambda deployment (Phase 10)..."

# Configuration
FUNCTION_NAME="iut02-blanket-api"
REGION="ap-southeast-1"
RUNTIME="python3.11"
HANDLER="lambda_handler.handler"
MEMORY_SIZE=512  # Increased for fund management operations
TIMEOUT=60       # Increased for database operations
ROLE_NAME="iut02-lambda-execution-role"

# DynamoDB Tables
DYNAMODB_USERS_TABLE="iut02-users"
DYNAMODB_SESSIONS_TABLE="iut02-sessions"
DYNAMODB_PROJECTS_TABLE="iut02-projects"
DYNAMODB_CONTRIBUTIONS_TABLE="iut02-contributions"
DYNAMODB_SETTINGS_TABLE="iut02-settings"
DYNAMODB_MEDIA_TABLE="iut02-media"
DYNAMODB_DISTRIBUTIONS_TABLE="iut02-distributions"

# S3 Bucket
S3_MEDIA_BUCKET="iut02-media-uploads"

# Frontend URL - Amplify deployment
FRONTEND_URL="${FRONTEND_URL:-https://dev.d1js9a712g4lw.amplifyapp.com}"

# OAuth Configuration (must be provided via environment)
# Fail fast if required secrets are missing to avoid deploying placeholders
: "${GOOGLE_CLIENT_ID:?GOOGLE_CLIENT_ID not set}"
: "${GOOGLE_CLIENT_SECRET:?GOOGLE_CLIENT_SECRET not set}"
: "${JWT_SECRET_KEY:?JWT_SECRET_KEY not set}"

# API base for production callback URLs
API_BASE="${API_BASE:-https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com}"
GOOGLE_REDIRECT_URI="${GOOGLE_REDIRECT_URI:-$API_BASE/auth/google/callback}"
FACEBOOK_REDIRECT_URI="${FACEBOOK_REDIRECT_URI:-$API_BASE/auth/facebook/callback}"
AMAZON_REDIRECT_URI="${AMAZON_REDIRECT_URI:-$API_BASE/auth/amazon/callback}"

# GitHub URLs for Excel data (legacy support)
EXCEL_URL="https://raw.githubusercontent.com/kahmed25/iut02-blanket/dev/i.02%20blanket%20distribution%202026.xlsx"
IMAGES_BASE_URL="https://raw.githubusercontent.com/kahmed25/iut02-blanket/dev/images"

# Create deployment package directory
echo "📦 Creating deployment package..."
DEPLOY_DIR="lambda_deployment"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Install dependencies
# First install binary packages with platform-specific wheels
echo "📥 Installing Python dependencies (binary packages)..."
pip install -r backend/requirements.txt --target $DEPLOY_DIR --platform manylinux2014_x86_64 --only-binary=:all: --python-version 3.11 --quiet 2>/dev/null || true

# Then install pure-python packages that don't have platform-specific wheels
echo "📥 Installing Python dependencies (pure-python packages)..."
pip install email-validator dnspython idna --target $DEPLOY_DIR --quiet

# Copy backend code - main files
echo "📋 Copying backend code..."
cp backend/app.py $DEPLOY_DIR/
cp backend/config.py $DEPLOY_DIR/
cp backend/excel_parser.py $DEPLOY_DIR/
cp backend/lambda_handler.py $DEPLOY_DIR/

# Copy auth module
echo "📋 Copying auth module..."
mkdir -p $DEPLOY_DIR/auth
cp -r backend/auth/*.py $DEPLOY_DIR/auth/

# Copy fund module
echo "📋 Copying fund module..."
mkdir -p $DEPLOY_DIR/fund
cp -r backend/fund/*.py $DEPLOY_DIR/fund/

# Copy middleware module
echo "📋 Copying middleware module..."
mkdir -p $DEPLOY_DIR/middleware
cp -r backend/middleware/*.py $DEPLOY_DIR/middleware/

# Copy templates directory (for Excel import)
echo "📋 Copying templates..."
mkdir -p $DEPLOY_DIR/templates
cp -r backend/templates/*.xlsx $DEPLOY_DIR/templates/ 2>/dev/null || echo "  No templates to copy"

# Remove unnecessary files to reduce package size
# NOTE: Keep .dist-info directories - they contain package metadata required for imports
echo "🧹 Optimizing package size..."
find $DEPLOY_DIR -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
find $DEPLOY_DIR -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find $DEPLOY_DIR -name "*.pyc" -delete 2>/dev/null || true
find $DEPLOY_DIR -name "*.pyo" -delete 2>/dev/null || true
# DO NOT remove .dist-info - needed for package metadata
# find $DEPLOY_DIR -name "*.dist-info" -type d -exec rm -rf {} + 2>/dev/null || true
find $DEPLOY_DIR -name "*.egg-info" -type d -exec rm -rf {} + 2>/dev/null || true

# Create zip file
echo "🗜️  Creating deployment package..."
cd $DEPLOY_DIR
zip -r ../lambda_deployment.zip . -q
cd ..

echo "📊 Package size: $(du -h lambda_deployment.zip | cut -f1)"

# Check if IAM role exists, if not create it
echo "🔐 Checking IAM role..."
if ! aws iam get-role --role-name $ROLE_NAME 2>/dev/null; then
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
        --no-cli-pager

    # Attach basic Lambda execution policy
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
        --no-cli-pager

    echo "⏳ Waiting for role to be available..."
    sleep 10
    
    rm trust-policy.json
fi

# Create and attach DynamoDB/S3 policy
echo "📜 Creating DynamoDB and S3 policy..."
POLICY_NAME="iut02-lambda-dynamodb-s3-policy"

cat > dynamodb-s3-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchWriteItem",
        "dynamodb:BatchGetItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:$REGION:*:table/iut02-*",
        "arn:aws:dynamodb:$REGION:*:table/iut02-*/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::$S3_MEDIA_BUCKET",
        "arn:aws:s3:::$S3_MEDIA_BUCKET/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail",
        "ses:GetIdentityVerificationAttributes"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Check if policy exists
if aws iam get-policy --policy-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/$POLICY_NAME" 2>/dev/null; then
    echo "  Policy exists, creating new version..."
    aws iam create-policy-version \
        --policy-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/$POLICY_NAME" \
        --policy-document file://dynamodb-s3-policy.json \
        --set-as-default \
        --no-cli-pager 2>/dev/null || true
else
    echo "  Creating new policy..."
    aws iam create-policy \
        --policy-name $POLICY_NAME \
        --policy-document file://dynamodb-s3-policy.json \
        --no-cli-pager 2>/dev/null || true
fi

# Attach policy to role
echo "  Attaching policy to role..."
aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/$POLICY_NAME" \
    --no-cli-pager 2>/dev/null || true

rm dynamodb-s3-policy.json

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
echo "✅ Using IAM Role: $ROLE_ARN"

# Upload deployment package to S3 (required for packages > 50MB)
echo "📤 Uploading deployment package to S3..."
DEPLOY_BUCKET="iut02-lambda-deployments"

# Create deployment bucket if it doesn't exist
if ! aws s3api head-bucket --bucket $DEPLOY_BUCKET 2>/dev/null; then
    echo "  Creating deployment bucket..."
    aws s3api create-bucket \
        --bucket $DEPLOY_BUCKET \
        --region $REGION \
        --create-bucket-configuration LocationConstraint=$REGION \
        --no-cli-pager
fi

# Upload zip to S3
aws s3 cp lambda_deployment.zip s3://$DEPLOY_BUCKET/lambda_deployment.zip --quiet
echo "✅ Package uploaded to s3://$DEPLOY_BUCKET/lambda_deployment.zip"

# Build environment variables
ENV_VARS="Variables={"
ENV_VARS+="ENVIRONMENT=aws,"
ENV_VARS+="DATABASE_TYPE=dynamodb,"
ENV_VARS+="DYNAMODB_REGION=$REGION,"
ENV_VARS+="DYNAMODB_USERS_TABLE=$DYNAMODB_USERS_TABLE,"
ENV_VARS+="DYNAMODB_SESSIONS_TABLE=$DYNAMODB_SESSIONS_TABLE,"
ENV_VARS+="DYNAMODB_PROJECTS_TABLE=$DYNAMODB_PROJECTS_TABLE,"
ENV_VARS+="DYNAMODB_CONTRIBUTIONS_TABLE=$DYNAMODB_CONTRIBUTIONS_TABLE,"
ENV_VARS+="DYNAMODB_SETTINGS_TABLE=$DYNAMODB_SETTINGS_TABLE,"
ENV_VARS+="DYNAMODB_MEDIA_TABLE=$DYNAMODB_MEDIA_TABLE,"
ENV_VARS+="DYNAMODB_DISTRIBUTIONS_TABLE=$DYNAMODB_DISTRIBUTIONS_TABLE,"
ENV_VARS+="S3_MEDIA_BUCKET=$S3_MEDIA_BUCKET,"
ENV_VARS+="S3_REGION=$REGION,"
ENV_VARS+="FRONTEND_URL=$FRONTEND_URL,"
ENV_VARS+="ALLOWED_ORIGINS=$FRONTEND_URL,"
ENV_VARS+="JWT_SECRET_KEY=$JWT_SECRET_KEY,"
ENV_VARS+="GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,"
ENV_VARS+="GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET,"
ENV_VARS+="GOOGLE_REDIRECT_URI=$GOOGLE_REDIRECT_URI,"
ENV_VARS+="FACEBOOK_REDIRECT_URI=$FACEBOOK_REDIRECT_URI,"
ENV_VARS+="AMAZON_REDIRECT_URI=$AMAZON_REDIRECT_URI,"
ENV_VARS+="EXCEL_URL=$EXCEL_URL,"
ENV_VARS+="IMAGES_SOURCE_TYPE=url,"
ENV_VARS+="IMAGES_BASE_URL=$IMAGES_BASE_URL,"
ENV_VARS+="DATA_SOURCE_MODE=dynamic,"
ENV_VARS+="EMAIL_ENABLED=true,"
ENV_VARS+="AWS_REGION=$REGION,"
ENV_VARS+="SES_FROM_EMAIL=login@devopz.ai,"
ENV_VARS+="SES_FROM_NAME=IUT02 Care"
ENV_VARS+="}"

# Check if Lambda function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null; then
    echo "🔄 Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --s3-bucket $DEPLOY_BUCKET \
        --s3-key lambda_deployment.zip \
        --region $REGION \
        --no-cli-pager

    echo "⏳ Waiting for update to complete..."
    aws lambda wait function-updated --function-name $FUNCTION_NAME --region $REGION

    # Update configuration
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --handler $HANDLER \
        --memory-size $MEMORY_SIZE \
        --timeout $TIMEOUT \
        --environment "$ENV_VARS" \
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
        --code S3Bucket=$DEPLOY_BUCKET,S3Key=lambda_deployment.zip \
        --environment "$ENV_VARS" \
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
FUNCTION_ARN=$(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.FunctionArn' --output text)
echo $FUNCTION_ARN

echo ""
echo "✨ Phase 10 Deployment complete!"
echo ""
echo "Environment Variables Set:"
echo "  - ENVIRONMENT: aws"
echo "  - DATABASE_TYPE: dynamodb"
echo "  - DynamoDB Tables: iut02-users, iut02-sessions, iut02-projects, iut02-contributions, iut02-settings, iut02-media, iut02-distributions"
echo "  - S3 Bucket: $S3_MEDIA_BUCKET"
echo "  - Frontend URL: $FRONTEND_URL"
echo ""
echo "Next steps:"
echo "1. Create API Gateway HTTP API (if not exists)"
echo "2. Configure API Gateway to trigger this Lambda"
echo "3. Update FRONTEND_URL with actual Amplify domain"
echo "4. Update OAuth credentials in Lambda environment"
echo "5. Test the API endpoint"
