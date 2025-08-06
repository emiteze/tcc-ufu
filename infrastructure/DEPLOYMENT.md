# Deployment Guide

This document explains the deployment workflow for separating infrastructure from application deployment.

## Infrastructure vs Application Separation

- **Terraform**: Creates AWS infrastructure (EKS, DynamoDB, API Gateway, IAM roles)
- **CI/CD Pipeline**: Handles application deployment using Helm charts

## Deployment Flow

### 1. Infrastructure Deployment (One-time)
```bash
cd infrastructure
terraform init
terraform plan
terraform apply
```

### 2. Application Deployment (Via CI/CD)
The CI/CD pipeline will:
1. Build Docker image and push to ECR
2. Deploy using Helm chart with proper values:
   ```bash
   helm upgrade --install customer-api ./charts/customer-api \
     --set image.repository=760347630853.dkr.ecr.us-east-1.amazonaws.com/customer-api \
     --set image.tag=$IMAGE_TAG \
     --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=$POD_ROLE_ARN \
     --set config.awsRegion=us-east-1 \
     --set config.tableName=Customers
   ```

### 3. API Gateway Integration (After first deployment)
After the application is deployed and ALB is created:

```bash
# Get ALB hostname
ALB_HOSTNAME=$(kubectl get ingress customer-management-customer-api -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Create API Gateway integration
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id $(terraform output -raw api_gateway_id) \
  --integration-type HTTP_PROXY \
  --integration-method ANY \
  --integration-uri http://$ALB_HOSTNAME \
  --query 'IntegrationId' --output text)

# Create route
aws apigatewayv2 create-route \
  --api-id $(terraform output -raw api_gateway_id) \
  --route-key "ANY /{proxy+}" \
  --target integrations/$INTEGRATION_ID
```

## Required CI/CD Environment Variables

The CI/CD pipeline will need these values from Terraform outputs:
- `EKS_CLUSTER_NAME`: `terraform output -raw cluster_name`
- `ECR_REPOSITORY_URL`: `760347630853.dkr.ecr.us-east-1.amazonaws.com/customer-api`
- `POD_ROLE_ARN`: `terraform output -raw pod_role_arn`
- `AWS_REGION`: `us-east-1`
- `DYNAMODB_TABLE_NAME`: `terraform output -raw dynamodb_table_name`

## Testing Infrastructure Only
```bash
# Verify EKS cluster
aws eks describe-cluster --name $(terraform output -raw cluster_name)

# Verify DynamoDB table
aws dynamodb describe-table --table-name $(terraform output -raw dynamodb_table_name)

# Verify API Gateway (will be empty until integration is setup)
curl $(terraform output -raw api_gateway_url)
```