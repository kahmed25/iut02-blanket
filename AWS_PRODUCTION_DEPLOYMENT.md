# AWS Production Deployment Summary

## Current Deployment Status

### ✅ Deployed Infrastructure

#### 1. API Gateway (Backend)
- **API Name**: `iut02-blanket-api`
- **API ID**: `hz0qnbuf64`
- **Endpoint**: `https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com`
- **Region**: `ap-southeast-1` (Singapore)

#### 2. AWS Amplify (Frontend)
- **App Name**: `iut02-blanket`
- **App ID**: `d1js9a712g4lw`
- **Production URL**: `https://dev.d1js9a712g4lw.amplifyapp.com`
- **Branch**: `dev`

#### 3. Lambda Function
- **Function Name**: `iut02-blanket-api`
- **Runtime**: Python 3.11
- **Memory**: 512 MB
- **Timeout**: 60 seconds

#### 4. DynamoDB Tables
- `iut02-users` - User accounts
- `iut02-sessions` - Auth sessions
- `iut02-projects` - Charity projects
- `iut02-contributions` - Donations/contributions
- `iut02-distributions` - Fund distributions
- `iut02-settings` - Application settings
- `iut02-media` - Media file metadata

#### 5. S3 Bucket
- **Bucket Name**: `iut02-media-uploads`
- **Purpose**: Media file storage (images, documents)

---

## 🔐 OAuth Configuration Required

### Callback URLs for OAuth Providers

You need to configure the following **redirect/callback URLs** in your OAuth provider consoles:

#### Google OAuth Console
**Authorized redirect URIs** (add all three):
```
https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com/auth/google/callback
https://dev.d1js9a712g4lw.amplifyapp.com/auth/success
http://localhost:8000/auth/google/callback
```

**Steps**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add the URLs above
4. Click "Save"

---

#### Facebook OAuth Console
**Valid OAuth Redirect URIs**:
```
https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com/auth/facebook/callback
https://dev.d1js9a712g4lw.amplifyapp.com/auth/success
http://localhost:8000/auth/facebook/callback
```

**Steps**:
1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Select your app
3. Go to "Facebook Login" → "Settings"
4. Add the URLs to "Valid OAuth Redirect URIs"
5. Click "Save Changes"

---

#### Amazon OAuth Console
**Allowed Return URLs**:
```
https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com/auth/amazon/callback
https://dev.d1js9a712g4lw.amplifyapp.com/auth/success
http://localhost:8000/auth/amazon/callback
```

**Steps**:
1. Go to [Amazon Developer Console](https://developer.amazon.com/apps-and-games/login-with-amazon)
2. Select your app (Security Profile)
3. Under "Web Settings", add the URLs to "Allowed Return URLs"
4. Click "Save"

---

## Environment Variables (Lambda Configuration)

The Lambda function needs these environment variables:

```bash
ENVIRONMENT=aws
AWS_REGION=ap-southeast-1

# DynamoDB Tables
DYNAMODB_USERS_TABLE=iut02-users
DYNAMODB_SESSIONS_TABLE=iut02-sessions
DYNAMODB_PROJECTS_TABLE=iut02-projects
DYNAMODB_CONTRIBUTIONS_TABLE=iut02-contributions
DYNAMODB_DISTRIBUTIONS_TABLE=iut02-distributions
DYNAMODB_SETTINGS_TABLE=iut02-settings
DYNAMODB_MEDIA_TABLE=iut02-media

# S3
S3_MEDIA_BUCKET=iut02-media-uploads

# Frontend URL
FRONTEND_URL=https://dev.d1js9a712g4lw.amplifyapp.com

# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth - Facebook
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# OAuth - Amazon
AMAZON_CLIENT_ID=your-amazon-client-id
AMAZON_CLIENT_SECRET=your-amazon-client-secret

# JWT
JWT_SECRET_KEY=your-secure-random-jwt-secret-key
JWT_ALGORITHM=HS256

# Excel (Legacy support - optional)
EXCEL_SOURCE_TYPE=url
EXCEL_URL=https://raw.githubusercontent.com/kahmed25/iut02-blanket/dev/i.02%20blanket%20distribution%202026.xlsx
IMAGES_SOURCE_TYPE=url
IMAGES_BASE_URL=https://raw.githubusercontent.com/kahmed25/iut02-blanket/dev/images
```

---

## Next Steps to Complete Deployment

### 1. Update Lambda Environment Variables
```bash
cd /Users/rashedahmed/Documents/DEVOPSIS/IUT02
./update_lambda_env.sh  # If script exists, or manually via AWS Console
```

Or manually in AWS Console:
1. Go to [Lambda Console](https://ap-southeast-1.console.aws.amazon.com/lambda/home?region=ap-southeast-1#/functions/iut02-blanket-api)
2. Click "Configuration" → "Environment variables"
3. Add/update the variables listed above

### 2. Configure OAuth Providers
- Follow the OAuth configuration steps above for each provider
- Make sure to update your OAuth credentials in Lambda environment variables

### 3. Test the Deployment
```bash
# Test backend API
curl https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com/auth/providers

# Test frontend
open https://dev.d1js9a712g4lw.amplifyapp.com
```

### 4. Update Amplify Environment Variables
Go to [Amplify Console](https://ap-southeast-1.console.aws.amazon.com/amplify/home?region=ap-southeast-1#/d1js9a712g4lw) and add:
```
NEXT_PUBLIC_API_URL=https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com
```

---

## Deployment Scripts

### Redeploy Lambda Function
```bash
cd /Users/rashedahmed/Documents/DEVOPSIS/IUT02
./deploy_lambda_phase10.sh
```

### Redeploy Frontend (Amplify)
```bash
cd /Users/rashedahmed/Documents/DEVOPSIS/IUT02
git push origin dev  # Amplify auto-deploys from git
```

Or manually trigger:
```bash
aws amplify start-job \
  --app-id d1js9a712g4lw \
  --branch-name dev \
  --job-type RELEASE \
  --region ap-southeast-1
```

---

## URLs Summary

| Service | URL |
|---------|-----|
| **Production Frontend** | https://dev.d1js9a712g4lw.amplifyapp.com |
| **Backend API** | https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com |
| **API Docs** | https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com/docs |
| **Local Frontend** | http://localhost:3000 |
| **Local Backend** | http://localhost:8000 |

---

## Monitoring & Logs

### CloudWatch Logs
```bash
# View Lambda logs
aws logs tail /aws/lambda/iut02-blanket-api --follow --region ap-southeast-1

# View recent errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/iut02-blanket-api \
  --filter-pattern "ERROR" \
  --region ap-southeast-1
```

### Amplify Deployment Logs
Check in [Amplify Console](https://ap-southeast-1.console.aws.amazon.com/amplify/home?region=ap-southeast-1#/d1js9a712g4lw/deployments)

---

## Cost Estimation

### Monthly AWS Costs (Estimated)
- **Lambda**: ~$5-10 (based on usage)
- **API Gateway**: ~$3-7 (based on requests)
- **DynamoDB**: ~$2-5 (on-demand pricing)
- **S3**: ~$1-3 (storage + bandwidth)
- **Amplify**: ~$0 (within free tier for dev)
- **Total**: ~$11-25/month (low to moderate usage)

---

## Security Checklist

- [ ] OAuth credentials configured in all providers
- [ ] JWT_SECRET_KEY set to a strong random value
- [ ] DynamoDB tables have proper access patterns
- [ ] S3 bucket has CORS configured
- [ ] Lambda has minimum required IAM permissions
- [ ] HTTPS enforced on all endpoints
- [ ] Frontend environment variables set
- [ ] Test all OAuth flows in production

---

## Troubleshooting

### OAuth Login Not Working
1. Check callback URLs are correctly configured
2. Verify OAuth credentials in Lambda environment variables
3. Check CloudWatch logs for errors
4. Ensure FRONTEND_URL is correct in Lambda

### Frontend Can't Connect to Backend
1. Check NEXT_PUBLIC_API_URL in Amplify environment variables
2. Verify CORS is configured in Lambda
3. Test API endpoint directly with curl

### Media Upload Fails
1. Check S3 bucket permissions
2. Verify Lambda has s3:PutObject permission
3. Check bucket name in environment variables

---

## Rollback Plan

If deployment fails:
```bash
# Rollback Lambda to previous version
aws lambda update-function-code \
  --function-name iut02-blanket-api \
  --zip-file fileb://lambda_deployment_backup.zip \
  --region ap-southeast-1

# Rollback Amplify to previous commit
# Via Amplify Console → Deployments → Redeploy
```
