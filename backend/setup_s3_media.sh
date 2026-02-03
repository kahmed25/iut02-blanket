#!/bin/bash

# Phase 10: S3 Bucket Setup Script for Media Storage
# Creates and configures S3 bucket for media uploads

REGION="ap-southeast-1"
BUCKET_NAME="iut02-media-uploads"

echo "🪣 Creating S3 bucket for IUT02 media storage..."
echo "Bucket: $BUCKET_NAME"
echo "Region: $REGION"
echo ""

# =============================================================================
# Create Bucket
# =============================================================================
echo "📦 Creating S3 bucket..."
aws s3api create-bucket \
  --bucket $BUCKET_NAME \
  --region $REGION \
  --create-bucket-configuration LocationConstraint=$REGION \
  --no-cli-pager 2>/dev/null || echo "  Bucket may already exist"

# =============================================================================
# Block Public Access (Security Best Practice)
# =============================================================================
echo "🔒 Configuring public access block..."
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration '{
    "BlockPublicAcls": true,
    "IgnorePublicAcls": true,
    "BlockPublicPolicy": true,
    "RestrictPublicBuckets": true
  }' \
  --region $REGION \
  --no-cli-pager

# =============================================================================
# Configure CORS
# =============================================================================
echo "🌐 Configuring CORS..."
aws s3api put-bucket-cors \
  --bucket $BUCKET_NAME \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": [
          "http://localhost:3000",
          "https://*.amplifyapp.com"
        ],
        "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
        "MaxAgeSeconds": 3600
      }
    ]
  }' \
  --region $REGION \
  --no-cli-pager

# =============================================================================
# Create Folder Structure
# =============================================================================
echo "📁 Creating folder structure..."
# Create placeholder files to establish folder structure
echo "" | aws s3 cp - s3://$BUCKET_NAME/images/.keep --region $REGION --no-cli-pager 2>/dev/null
echo "" | aws s3 cp - s3://$BUCKET_NAME/videos/.keep --region $REGION --no-cli-pager 2>/dev/null
echo "" | aws s3 cp - s3://$BUCKET_NAME/audio/.keep --region $REGION --no-cli-pager 2>/dev/null
echo "" | aws s3 cp - s3://$BUCKET_NAME/proofs/.keep --region $REGION --no-cli-pager 2>/dev/null

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "✅ S3 bucket created and configured successfully!"
echo ""
echo "Bucket: s3://$BUCKET_NAME"
echo "Region: $REGION"
echo ""
echo "Configuration:"
echo "  - Public access: BLOCKED (secure)"
echo "  - CORS: Enabled for localhost and Amplify domains"
echo "  - Folders: images/, videos/, audio/, proofs/"
echo ""
echo "Note: Media will be served via Lambda presigned URLs for security."
echo ""
echo "Next steps:"
echo "1. Update Lambda IAM role with S3 permissions"
echo "2. Deploy Lambda: ./deploy_lambda.sh"
echo ""
echo "IAM Policy to add to Lambda role:"
echo '
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::'$BUCKET_NAME'",
        "arn:aws:s3:::'$BUCKET_NAME'/*"
      ]
    }
  ]
}
'
