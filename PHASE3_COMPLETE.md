# Phase 3: AWS Deployment - COMPLETE ✅

## Overview
Phase 3 successfully deploys the application to AWS cloud infrastructure using a **free-tier optimized** serverless architecture. The deployment costs **$0/month** for the first 12 months, then approximately **$0.01-0.10/month** for typical POC usage.

## Deployment Architecture

```
┌─────────────────────┐
│   Users/Browsers    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│   AWS Amplify (Frontend Hosting)   │
│   - Next.js Static Site             │
│   - Built-in CDN                    │
│   - Free SSL Certificate            │
│   - Auto-deploy from GitHub         │
└──────────┬──────────────────────────┘
           │ API Calls
           ▼
┌─────────────────────────────────────┐
│   API Gateway HTTP API              │
│   - RESTful endpoints               │
│   - CORS configured                 │
│   - Lambda integration              │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│   AWS Lambda (Backend API)          │
│   - FastAPI application             │
│   - Python 3.11 runtime             │
│   - 512MB memory, 30s timeout       │
│   - Fetches data from GitHub        │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│   GitHub (Data Storage - FREE)      │
│   - Excel file                      │
│   - Images                          │
│   - Version control                 │
└─────────────────────────────────────┘
```

## Deployed Resources

### 1. AWS Lambda Function ✅
- **Name**: `iut02-blanket-api`
- **ARN**: `arn:aws:lambda:ap-southeast-1:416255541879:function:iut02-blanket-api`
- **Runtime**: Python 3.11
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Handler**: `lambda_handler.handler`
- **Region**: ap-southeast-1 (Singapore)
- **Code Size**: ~35 MB (includes pandas, FastAPI, etc.)

**Environment Variables:**
```
EXCEL_SOURCE_TYPE=url
EXCEL_URL=https://raw.githubusercontent.com/kahmed25/iut02-blanket/dev/i.02%20blanket%20distribution%202026.xlsx
IMAGES_SOURCE_TYPE=url
IMAGES_BASE_URL=https://raw.githubusercontent.com/kahmed25/iut02-blanket/dev/images
CACHE_EXPIRATION_SECONDS=300
```

### 2. API Gateway HTTP API ✅
- **API ID**: `hz0qnbuf64`
- **Endpoint**: `https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com`
- **Type**: HTTP API (cheaper than REST API)
- **Region**: ap-southeast-1
- **Integration**: Lambda Proxy
- **CORS**: Enabled for all origins

**Available Endpoints:**
- `GET /` - API information
- `GET /health` - Health check
- `GET /api/data` - Excel data as JSON
- `GET /api/summary` - Data summary
- `GET /api/images` - List of images
- `GET /images/{filename}` - Proxy images from GitHub
- `POST /api/cache/clear` - Clear cached data

### 3. AWS Amplify (Frontend) 📋
- **Status**: Ready for deployment
- **App Name**: `iut02-blanket-frontend`
- **Source**: GitHub (kahmed25/iut02-blanket, branch: dev)
- **Build Config**: `amplify.yml`
- **Output**: Static site from `frontend/out`

**Deployment Instructions**: See "Frontend Deployment" section below

### 4. S3 Bucket (Lambda Deployment Only)
- **Name**: `iut02-lambda-deployments`
- **Purpose**: Store Lambda deployment packages (>50MB)
- **Region**: ap-southeast-1
- **Public Access**: Blocked (private bucket)

### 5. IAM Role
- **Name**: `iut02-lambda-execution-role`
- **Purpose**: Lambda execution permissions
- **Policies**: AWSLambdaBasicExecutionRole (CloudWatch Logs)

## Cost Breakdown

### Monthly Costs (Low Traffic: 10,000 requests/month)

#### First 12 Months: **$0.00/month** ✅

| Service | Usage | Cost |
|---------|-------|------|
| AWS Lambda | < 1M requests, < 400K GB-seconds | **$0.00** (free tier) |
| API Gateway HTTP API | < 1M requests | **$0.00** (free tier) |
| AWS Amplify | < 1000 build min, < 15GB served | **$0.00** (free tier) |
| GitHub | Public repository | **$0.00** (always free) |
| S3 Storage | ~35MB (Lambda code) | **$0.00** (under 5GB free tier) |
| Data Transfer | < 100GB/month | **$0.00** (free tier) |
| **Total** | | **$0.00/month** |

#### After 12 Months: **~$0.01-0.10/month** ✅

| Service | Usage | Cost |
|---------|-------|------|
| AWS Lambda | 10K requests | **$0.00** (always free under 1M) |
| API Gateway HTTP API | 10K requests | **~$0.01** ($1 per 1M requests) |
| AWS Amplify | 2 builds, 1GB served | **$0.00** (always free under limits) |
| GitHub | Public repository | **$0.00** (always free) |
| S3 Storage | ~35MB | **$0.00** (under 5GB free tier) |
| Data Transfer | < 100GB | **$0.00** (free tier) |
| **Total** | | **~$0.01/month** |

### Cost by Traffic Level (After 12 Months)

| Monthly Traffic | API Gateway | Lambda | Amplify | Total |
|----------------|-------------|---------|---------|-------|
| 1,000 requests | $0.00 | $0.00 | $0.00 | **$0.00** |
| 10,000 requests | $0.01 | $0.00 | $0.00 | **$0.01** |
| 100,000 requests | $0.10 | $0.00 | $0.00 | **$0.10** |
| 1,000,000 requests | $1.00 | $0.00 | $0.00 | **$1.00** |

**Conclusion**: Essentially FREE forever for POC usage! 🎉

## Testing the Deployment

### Backend API Tests

1. **Health Check:**
```bash
curl https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com/health
```

Expected Response:
```json
{
  "status": "healthy",
  "configuration": {
    "excel_source": "url",
    "images_source": "url"
  },
  "excel_url": "https://raw.githubusercontent.com/kahmed25/...",
  "images_base_url": "https://raw.githubusercontent.com/kahmed25/..."
}
```

2. **Excel Data:**
```bash
curl https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com/api/data | jq
```

3. **API Info:**
```bash
curl https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com/
```

## Frontend Deployment to Amplify

### Manual Setup (Required for GitHub Integration)

1. **Open AWS Amplify Console:**
   - URL: https://ap-southeast-1.console.aws.amazon.com/amplify/home?region=ap-southeast-1

2. **Create New App:**
   - Click "New app" → "Host web app"
   - Choose "GitHub" as source
   - Authorize AWS Amplify to access GitHub

3. **Select Repository:**
   - Repository: `kahmed25/iut02-blanket`
   - Branch: `dev`

4. **Configure App:**
   - App name: `iut02-blanket-frontend`
   - Build settings: Amplify auto-detects `amplify.yml`

5. **Environment Variables:**
   Go to "Advanced settings" → "Environment variables" and add:
   ```
   NEXT_PUBLIC_API_URL=https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com
   BUILD_ENV=production
   ```

6. **Deploy:**
   - Click "Save and deploy"
   - Wait 5-10 minutes for build to complete

7. **Access Your App:**
   - URL will be: `https://dev.<app-id>.amplifyapp.com`
   - Amplify will also provide a custom subdomain option

### Post-Deployment

After Amplify deployment completes:
1. Visit the Amplify URL
2. Test that data loads from API Gateway
3. Verify images display correctly
4. Update this document with the Amplify URL

## Local Development (Phase 1 Still Works!)

The deployment **does NOT break** local development:

```bash
# Terminal 1: Start local backend
./start_backend.sh

# Terminal 2: Start local frontend  
./start_frontend.sh
```

- Local frontend automatically uses `http://localhost:8000`
- No environment variables needed for local dev
- Phase 1 functionality fully preserved ✅

## Updating the Application

### 1. Update Data (Excel/Images)

**Method A: GitHub Web Interface** (Easiest)
1. Go to https://github.com/kahmed25/iut02-blanket
2. Switch to `dev` branch
3. Edit Excel file or upload new images
4. Commit changes
5. Changes reflect within 5 minutes (cache expiration)

**Method B: Git Command Line**
```bash
git checkout dev
# Update files
git add .
git commit -m "Update data"
git push origin dev
```

### 2. Update Backend Code

```bash
# Make changes to backend/*.py files
./deploy_lambda_s3.sh
```

This redeploys the Lambda function with your changes.

### 3. Update Frontend Code

Push changes to GitHub `dev` branch:
```bash
git add .
git commit -m "Update frontend"
git push origin dev
```

Amplify automatically detects the push and rebuilds/redeploys.

## Troubleshooting

### Issue: Lambda function times out
**Solution**: 
- Check Lambda logs: `aws logs tail /aws/lambda/iut02-blanket-api --region ap-southeast-1`
- Increase timeout if needed (max 15 minutes for Lambda)
- Check if GitHub URLs are accessible

### Issue: API Gateway returns 500 error
**Solution**:
- Check Lambda function is active
- Verify Lambda permissions for API Gateway
- Check CloudWatch logs for error details

### Issue: Frontend can't connect to API
**Solution**:
- Verify `NEXT_PUBLIC_API_URL` is set in Amplify environment variables
- Check API Gateway CORS configuration
- Test API endpoint directly with curl

### Issue: Data not updating
**Solution**:
- Wait 5 minutes for cache to expire
- Or call: `curl -X POST https://hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com/api/cache/clear`
- Verify GitHub has the latest files

### Issue: Amplify build fails
**Solution**:
- Check build logs in Amplify console
- Verify `amplify.yml` configuration
- Ensure environment variables are set
- Check `frontend/package.json` dependencies

## Monitoring and Logs

### Lambda Logs
```bash
# Tail recent logs
aws logs tail /aws/lambda/iut02-blanket-api --region ap-southeast-1 --follow

# Get logs from last hour
aws logs tail /aws/lambda/iut02-blanket-api --region ap-southeast-1 --since 1h
```

### API Gateway Logs
- Enable in API Gateway console if needed
- CloudWatch log group: `/aws/apigateway/iut02-blanket-api`

### Amplify Build Logs
- Available in Amplify console
- Shows build progress, errors, and deployment status

## File Structure Updates

```
IUT02/
├── backend/
│   ├── lambda_handler.py      # NEW - Lambda entry point
│   ├── .env                    # UPDATED - Production defaults
│   └── config.py               # UPDATED - Lambda /tmp cache
├── frontend/
│   ├── .env.production         # NEW - Production API URL
│   ├── .env.local.example      # NEW - Local dev example
│   └── next.config.js          # UPDATED - Static export support
├── amplify.yml                 # NEW - Amplify build config
├── deploy_lambda_s3.sh         # NEW - Lambda deployment script
├── create_api_gateway.sh       # NEW - API Gateway setup
├── setup_amplify.sh            # NEW - Amplify instructions
├── api_endpoint.txt            # NEW - Saved API Gateway URL
└── PHASE3_COMPLETE.md          # NEW - This file
```

## Deployment Scripts

### Backend Deployment
```bash
./deploy_lambda_s3.sh
```

### API Gateway Setup
```bash
./create_api_gateway.sh
```

### Amplify Setup Instructions
```bash
./setup_amplify.sh
```

## Security Considerations

1. **API Gateway**: No authentication (public API) - add API keys/auth if needed
2. **Lambda**: Execution role has minimal permissions (CloudWatch Logs only)
3. **S3 Bucket**: Private (Lambda deployment packages only)
4. **GitHub**: Public repository (data is publicly accessible)
5. **CORS**: Currently allows all origins - restrict in production if needed

## Future Enhancements (Optional)

1. **Custom Domain**: Use Route 53 + ACM for custom domain
2. **Authentication**: Add Cognito or API keys
3. **Monitoring**: Set up CloudWatch alarms for errors
4. **CI/CD**: Automate deployments with GitHub Actions
5. **Database**: Move from Excel to DynamoDB for better performance
6. **Caching**: Add CloudFront in front of API Gateway
7. **Multi-region**: Deploy to multiple regions for HA

## What's Next: Phase 4 (Optional)

Potential future phases:
- Admin panel for non-technical users to update data
- Real-time updates (WebSocket support)
- Analytics dashboard
- Mobile app (React Native)
- Advanced reporting features

---

**Status**: Phase 3 Complete (Backend Deployed) ✅  
**Awaiting**: Amplify frontend deployment (manual GitHub setup)  
**Cost**: $0.00/month for first 12 months, ~$0.01/month after  
**Version**: 3.0.0
