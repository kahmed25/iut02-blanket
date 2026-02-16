#!/bin/bash

# Setup script for AWS SES Email Configuration
# This script verifies the SES configuration and email addresses for IUT02 Care

set -e

# Configuration
REGION=${AWS_REGION:-"ap-southeast-1"}
FROM_EMAIL=${SES_FROM_EMAIL:-"login@devopz.ai"}

echo "🚀 Setting up AWS SES for IUT02 Care Email Authentication..."
echo "Region: $REGION"
echo "From Email: $FROM_EMAIL"
echo

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS CLI not configured or credentials invalid"
    echo "Please run 'aws configure' first"
    exit 1
fi

echo "✅ AWS CLI configured successfully"

# Check if email is verified in SES
echo "📧 Checking email verification status..."
VERIFICATION_STATUS=$(aws ses get-identity-verification-attributes \
    --identities $FROM_EMAIL \
    --region $REGION \
    --query "VerificationAttributes.\"$FROM_EMAIL\".VerificationStatus" \
    --output text 2>/dev/null || echo "NotFound")

if [ "$VERIFICATION_STATUS" = "Success" ]; then
    echo "✅ Email $FROM_EMAIL is already verified in SES"
elif [ "$VERIFICATION_STATUS" = "Pending" ]; then
    echo "⏳ Email $FROM_EMAIL verification is pending"
    echo "   Check your email for verification link"
elif [ "$VERIFICATION_STATUS" = "NotFound" ] || [ "$VERIFICATION_STATUS" = "None" ]; then
    echo "📨 Email $FROM_EMAIL not verified. Initiating verification..."
    aws ses verify-email-identity \
        --email-address $FROM_EMAIL \
        --region $REGION
    echo "✅ Verification email sent to $FROM_EMAIL"
    echo "   Please check your email and click the verification link"
else
    echo "❓ Unknown verification status: $VERIFICATION_STATUS"
fi

# Check SES sending quota and rate
echo
echo "📊 Checking SES sending quota and rate limits..."
QUOTA_INFO=$(aws ses describe-account-sending-enabled \
    --region $REGION \
    --query "Enabled" \
    --output text 2>/dev/null || echo "error")

if [ "$QUOTA_INFO" = "True" ]; then
    echo "✅ SES sending is enabled for this account"
    
    # Get sending quota details
    SENDING_QUOTA=$(aws ses get-send-quota --region $REGION 2>/dev/null || echo "{}")
    if [ "$SENDING_QUOTA" != "{}" ]; then
        MAX_24_HOUR=$(echo $SENDING_QUOTA | jq -r '.Max24HourSend // "Unknown"')
        MAX_SEND_RATE=$(echo $SENDING_QUOTA | jq -r '.MaxSendRate // "Unknown"')
        SENT_LAST_24=$(echo $SENDING_QUOTA | jq -r '.SentLast24Hours // "Unknown"')
        
        echo "   📈 24-hour sending quota: $SENT_LAST_24 / $MAX_24_HOUR"
        echo "   🚀 Maximum send rate: $MAX_SEND_RATE emails/second"
    fi
elif [ "$QUOTA_INFO" = "False" ]; then
    echo "❌ SES sending is DISABLED for this account"
    echo "   This usually happens when you're in the SES sandbox"
    echo "   Please request production access from AWS SES console"
else
    echo "❓ Could not determine SES sending status"
fi

# Check if we're in SES sandbox
echo
echo "🏖️  Checking SES sandbox status..."
SANDBOX_STATUS=$(aws ses get-account-sending-enabled \
    --region $REGION \
    --query "Enabled" \
    --output text 2>/dev/null)

# Try sending a test email to check sandbox restrictions
echo "📧 Testing email capabilities..."
echo "   Note: In sandbox mode, you can only send to verified emails"

# List verified email addresses
echo
echo "📋 Currently verified email addresses:"
VERIFIED_EMAILS=$(aws ses list-verified-email-addresses \
    --region $REGION \
    --query "VerifiedEmailAddresses" \
    --output table 2>/dev/null || echo "Could not retrieve verified emails")

if [ "$VERIFIED_EMAILS" != "Could not retrieve verified emails" ]; then
    echo "$VERIFIED_EMAILS"
else
    echo "   ❌ Could not retrieve verified emails"
fi

echo
echo "🎉 SES setup check completed!"
echo
echo "📝 Next steps:"
echo "   1. Verify $FROM_EMAIL if not already verified"
echo "   2. If in sandbox mode, request production access from AWS SES console"
echo "   3. Test email sending with your application"
echo "   4. Monitor sending quotas and bounce/complaint rates"
echo
echo "💡 Useful commands:"
echo "   • Check verification: aws ses get-identity-verification-attributes --identities $FROM_EMAIL --region $REGION"
echo "   • Send test email: aws ses send-email --destination ToAddresses=test@example.com --message Subject='{Data=\"Test\"}',Body='{Text={Data=\"Test\"}}' --source $FROM_EMAIL --region $REGION"
echo "   • Check sending stats: aws ses get-send-statistics --region $REGION"
echo
echo "🔗 AWS SES Console: https://console.aws.amazon.com/ses/home?region=$REGION"