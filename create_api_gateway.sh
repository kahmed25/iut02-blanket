#!/bin/bash

# API Gateway HTTP API Setup Script
# Creates API Gateway and connects it to Lambda function

set -e

echo "🌐 Setting up API Gateway HTTP API..."

# Configuration
API_NAME="iut02-blanket-api"
FUNCTION_NAME="iut02-blanket-api"
REGION="ap-southeast-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Get Lambda function ARN
LAMBDA_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME"
echo "✅ Lambda ARN: $LAMBDA_ARN"

# Create HTTP API
echo "📡 Creating HTTP API..."
API_ID=$(aws apigatewayv2 create-api \
    --name $API_NAME \
    --protocol-type HTTP \
    --target $LAMBDA_ARN \
    --region $REGION \
    --query 'ApiId' \
    --output text)

echo "✅ API created with ID: $API_ID"

# Add Lambda permission for API Gateway to invoke
echo "🔐 Adding Lambda invoke permission..."
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*" \
    --region $REGION \
    --no-cli-pager || echo "Permission may already exist"

# Create integration
echo "🔗 Creating Lambda integration..."
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri $LAMBDA_ARN \
    --payload-format-version 2.0 \
    --region $REGION \
    --query 'IntegrationId' \
    --output text)

echo "✅ Integration created: $INTEGRATION_ID"

# Create default route (catch-all)
echo "🛣️  Creating routes..."
aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key '$default' \
    --target "integrations/$INTEGRATION_ID" \
    --region $REGION \
    --no-cli-pager

# Configure CORS
echo "🌍 Configuring CORS..."
aws apigatewayv2 update-api \
    --api-id $API_ID \
    --cors-configuration AllowOrigins='*',AllowMethods='GET,POST,PUT,DELETE,OPTIONS',AllowHeaders='*' \
    --region $REGION \
    --no-cli-pager

# Get API endpoint
API_ENDPOINT=$(aws apigatewayv2 get-api --api-id $API_ID --region $REGION --query 'ApiEndpoint' --output text)

echo ""
echo "✅ API Gateway HTTP API created successfully!"
echo ""
echo "📌 API Details:"
echo "  API ID: $API_ID"
echo "  API Endpoint: $API_ENDPOINT"
echo "  Region: $REGION"
echo ""
echo "🧪 Test endpoints:"
echo "  Health Check: $API_ENDPOINT/health"
echo "  API Data: $API_ENDPOINT/api/data"
echo "  Root: $API_ENDPOINT/"
echo ""
echo "💰 Cost: FREE (HTTP API - 1M requests/month free for 12 months)"
echo ""
echo "✨ Next: Configure frontend with API endpoint"
echo ""

# Save API endpoint to file for frontend configuration
echo "$API_ENDPOINT" > api_endpoint.txt
echo "💾 API endpoint saved to api_endpoint.txt"
