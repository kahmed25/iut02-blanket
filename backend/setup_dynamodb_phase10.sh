#!/bin/bash

# Phase 10: DynamoDB Setup Script for Fund Management Tables
# Creates all tables needed for Phases 5-8 features

REGION="ap-southeast-1"

echo "🚀 Creating DynamoDB tables for IUT02 Fund Management (Phase 10)..."
echo "Region: $REGION"
echo ""

# =============================================================================
# Projects Table
# =============================================================================
echo "📁 Creating iut02-projects table..."
aws dynamodb create-table \
  --table-name iut02-projects \
  --attribute-definitions \
    AttributeName=project_id,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=created_at,AttributeType=S \
  --key-schema \
    AttributeName=project_id,KeyType=HASH \
  --global-secondary-indexes \
    '[
      {
        "IndexName": "StatusIndex",
        "KeySchema": [
          {"AttributeName":"status","KeyType":"HASH"},
          {"AttributeName":"created_at","KeyType":"RANGE"}
        ],
        "Projection":{"ProjectionType":"ALL"}
      }
    ]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  --no-cli-pager 2>/dev/null || echo "  Table may already exist"

echo "  Waiting for projects table..."
aws dynamodb wait table-exists --table-name iut02-projects --region $REGION 2>/dev/null

# =============================================================================
# Contributions Table
# =============================================================================
echo "💰 Creating iut02-contributions table..."
aws dynamodb create-table \
  --table-name iut02-contributions \
  --attribute-definitions \
    AttributeName=contribution_id,AttributeType=S \
    AttributeName=project_id,AttributeType=S \
    AttributeName=contribution_date,AttributeType=S \
    AttributeName=contributor_name,AttributeType=S \
  --key-schema \
    AttributeName=contribution_id,KeyType=HASH \
  --global-secondary-indexes \
    '[
      {
        "IndexName": "ProjectIndex",
        "KeySchema": [
          {"AttributeName":"project_id","KeyType":"HASH"},
          {"AttributeName":"contribution_date","KeyType":"RANGE"}
        ],
        "Projection":{"ProjectionType":"ALL"}
      },
      {
        "IndexName": "ContributorIndex",
        "KeySchema": [
          {"AttributeName":"project_id","KeyType":"HASH"},
          {"AttributeName":"contributor_name","KeyType":"RANGE"}
        ],
        "Projection":{"ProjectionType":"ALL"}
      }
    ]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  --no-cli-pager 2>/dev/null || echo "  Table may already exist"

echo "  Waiting for contributions table..."
aws dynamodb wait table-exists --table-name iut02-contributions --region $REGION 2>/dev/null

# =============================================================================
# Settings Table
# =============================================================================
echo "⚙️  Creating iut02-settings table..."
aws dynamodb create-table \
  --table-name iut02-settings \
  --attribute-definitions \
    AttributeName=setting_key,AttributeType=S \
  --key-schema \
    AttributeName=setting_key,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  --no-cli-pager 2>/dev/null || echo "  Table may already exist"

echo "  Waiting for settings table..."
aws dynamodb wait table-exists --table-name iut02-settings --region $REGION 2>/dev/null

# =============================================================================
# Media Table (Phase 6)
# =============================================================================
echo "🖼️  Creating iut02-media table..."
aws dynamodb create-table \
  --table-name iut02-media \
  --attribute-definitions \
    AttributeName=media_id,AttributeType=S \
    AttributeName=project_id,AttributeType=S \
    AttributeName=display_order,AttributeType=N \
  --key-schema \
    AttributeName=media_id,KeyType=HASH \
  --global-secondary-indexes \
    '[
      {
        "IndexName": "ProjectIndex",
        "KeySchema": [
          {"AttributeName":"project_id","KeyType":"HASH"},
          {"AttributeName":"display_order","KeyType":"RANGE"}
        ],
        "Projection":{"ProjectionType":"ALL"}
      }
    ]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  --no-cli-pager 2>/dev/null || echo "  Table may already exist"

echo "  Waiting for media table..."
aws dynamodb wait table-exists --table-name iut02-media --region $REGION 2>/dev/null

# =============================================================================
# Distributions Table (Phase 7)
# =============================================================================
echo "📊 Creating iut02-distributions table..."
aws dynamodb create-table \
  --table-name iut02-distributions \
  --attribute-definitions \
    AttributeName=distribution_id,AttributeType=S \
    AttributeName=project_id,AttributeType=S \
    AttributeName=distribution_date,AttributeType=S \
  --key-schema \
    AttributeName=distribution_id,KeyType=HASH \
  --global-secondary-indexes \
    '[
      {
        "IndexName": "ProjectIndex",
        "KeySchema": [
          {"AttributeName":"project_id","KeyType":"HASH"},
          {"AttributeName":"distribution_date","KeyType":"RANGE"}
        ],
        "Projection":{"ProjectionType":"ALL"}
      }
    ]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  --no-cli-pager 2>/dev/null || echo "  Table may already exist"

echo "  Waiting for distributions table..."
aws dynamodb wait table-exists --table-name iut02-distributions --region $REGION 2>/dev/null

# =============================================================================
# Insert Default Settings
# =============================================================================
echo "📝 Inserting default settings..."
aws dynamodb put-item \
  --table-name iut02-settings \
  --item '{
    "setting_key": {"S": "data_source_mode"},
    "setting_value": {"S": "dynamic"},
    "updated_at": {"S": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}
  }' \
  --region $REGION \
  --no-cli-pager 2>/dev/null

aws dynamodb put-item \
  --table-name iut02-settings \
  --item '{
    "setting_key": {"S": "default_currency"},
    "setting_value": {"S": "BDT"},
    "updated_at": {"S": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}
  }' \
  --region $REGION \
  --no-cli-pager 2>/dev/null

aws dynamodb put-item \
  --table-name iut02-settings \
  --item '{
    "setting_key": {"S": "email_notifications_enabled"},
    "setting_value": {"S": "false"},
    "updated_at": {"S": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}
  }' \
  --region $REGION \
  --no-cli-pager 2>/dev/null

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "✅ DynamoDB tables created successfully!"
echo ""
echo "Tables created:"
echo "  - iut02-projects (with StatusIndex GSI)"
echo "  - iut02-contributions (with ProjectIndex, ContributorIndex GSIs)"
echo "  - iut02-settings"
echo "  - iut02-media (with ProjectIndex GSI)"
echo "  - iut02-distributions (with ProjectIndex GSI)"
echo ""
echo "Default settings inserted:"
echo "  - data_source_mode: dynamic"
echo "  - default_currency: BDT"
echo "  - email_notifications_enabled: false"
echo ""
echo "Next steps:"
echo "1. Create S3 bucket for media: ./setup_s3_media.sh"
echo "2. Update Lambda IAM role with DynamoDB and S3 permissions"
echo "3. Deploy Lambda: ./deploy_lambda.sh"
