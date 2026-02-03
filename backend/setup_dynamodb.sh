#!/bin/bash

echo "Creating DynamoDB tables for IUT02 authentication..."

# Create Users table
echo "Creating iut02-users table..."
aws dynamodb create-table \
  --table-name iut02-users \
  --attribute-definitions \
    AttributeName=user_id,AttributeType=S \
    AttributeName=email,AttributeType=S \
    AttributeName=provider,AttributeType=S \
    AttributeName=provider_id,AttributeType=S \
  --key-schema \
    AttributeName=user_id,KeyType=HASH \
  --global-secondary-indexes \
    '[
      {
        "IndexName": "EmailIndex",
        "KeySchema": [{"AttributeName":"email","KeyType":"HASH"}],
        "Projection":{"ProjectionType":"ALL"},
        "ProvisionedThroughput":{"ReadCapacityUnits":5,"WriteCapacityUnits":5}
      },
      {
        "IndexName": "ProviderIndex",
        "KeySchema": [{"AttributeName":"provider","KeyType":"HASH"},{"AttributeName":"provider_id","KeyType":"RANGE"}],
        "Projection":{"ProjectionType":"ALL"},
        "ProvisionedThroughput":{"ReadCapacityUnits":5,"WriteCapacityUnits":5}
      }
    ]' \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

echo "Waiting for users table to be created..."
aws dynamodb wait table-exists --table-name iut02-users --region us-east-1

# Create Sessions table
echo "Creating iut02-sessions table..."
aws dynamodb create-table \
  --table-name iut02-sessions \
  --attribute-definitions \
    AttributeName=session_id,AttributeType=S \
    AttributeName=refresh_token,AttributeType=S \
  --key-schema \
    AttributeName=session_id,KeyType=HASH \
  --global-secondary-indexes \
    '[
      {
        "IndexName": "RefreshTokenIndex",
        "KeySchema": [{"AttributeName":"refresh_token","KeyType":"HASH"}],
        "Projection":{"ProjectionType":"ALL"},
        "ProvisionedThroughput":{"ReadCapacityUnits":5,"WriteCapacityUnits":5}
      }
    ]' \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

echo "Waiting for sessions table to be created..."
aws dynamodb wait table-exists --table-name iut02-sessions --region us-east-1

# Enable TTL on sessions table
echo "Enabling TTL on sessions table..."
aws dynamodb update-time-to-live \
  --table-name iut02-sessions \
  --time-to-live-specification "Enabled=true, AttributeName=ttl" \
  --region us-east-1

echo "✅ DynamoDB tables created successfully!"
echo ""
echo "Tables created:"
echo "  - iut02-users (with EmailIndex and ProviderIndex)"
echo "  - iut02-sessions (with RefreshTokenIndex and TTL enabled)"
echo ""
echo "Next steps:"
echo "1. Update Lambda environment variables with table names"
echo "2. Add DynamoDB permissions to Lambda execution role"
echo "3. Deploy your Lambda function with authentication code"
