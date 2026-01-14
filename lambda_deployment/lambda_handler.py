"""
AWS Lambda handler for FastAPI application
Uses Mangum to adapt FastAPI for AWS Lambda + API Gateway
"""
from mangum import Mangum
from app import app

# Create Lambda handler
handler = Mangum(app, lifespan="off")

# For local testing
if __name__ == "__main__":
    print("Lambda handler created successfully")
    print("Deploy this to AWS Lambda to handle requests")
