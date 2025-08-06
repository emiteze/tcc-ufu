# TCC-UFU Infrastructure

This directory contains Terraform configuration files for deploying the customer management backend to AWS using EKS, DynamoDB, and API Gateway.

## Architecture

- **EKS Cluster**: Kubernetes cluster for running the containerized backend
- **DynamoDB**: NoSQL database for customer data storage
- **API Gateway**: HTTP API as the entry point routing to EKS
- **VPC**: Network infrastructure with public/private subnets
- **IAM**: Roles and policies for secure service communication

## Prerequisites

1. **AWS CLI configured** with credentials for account `760347630853`
2. **Terraform installed** (>= 1.0)
3. **kubectl installed** for Kubernetes management
4. **Docker image** of your backend pushed to ECR

## Deployment Steps

### 1. Initialize Terraform
```bash
cd infrastructure
terraform init
```

### 2. Configure Variables
```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your specific values
```

### 3. Plan Deployment
```bash
terraform plan
```

### 4. Apply Infrastructure
```bash
terraform apply
```

### 5. Configure kubectl
```bash
aws eks update-kubeconfig --region us-east-1 --name tcc-ufu-dev-cluster
```

### 6. Build and Push Docker Image
```bash
# From the backend directory
cd ../backend

# Build the image
docker build -t customer-api .

# Tag for ECR (replace with your ECR repository URL)
docker tag customer-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/customer-api:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/customer-api:latest
```

### 7. Update Kubernetes Deployment
Update the image reference in `kubernetes.tf` or the deployment manifest to use your ECR image URL.

## Important Notes

- **ECR Repository**: You need to create an ECR repository and push your Docker image before deploying
- **Image Reference**: Update the image reference in the Kubernetes deployment to your ECR image
- **DynamoDB Endpoint**: The application will use the AWS DynamoDB service (not local)
- **Environment Variables**: Configured via Kubernetes ConfigMap

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

## Troubleshooting

1. **EKS Access**: Ensure your AWS credentials have EKS permissions
2. **Load Balancer**: Wait for the ALB to be provisioned before testing API Gateway
3. **Pod Permissions**: The pod service account has DynamoDB access via IRSA
4. **Health Checks**: The ingress uses `/customers` as the health check path

## Outputs

After deployment, Terraform will output:
- API Gateway URL
- EKS cluster details
- DynamoDB table information
- Load balancer controller role ARN