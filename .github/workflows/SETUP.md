# Pipeline Setup Guide

This guide helps you set up the GitHub Actions CI/CD pipeline for the backend application.

## Prerequisites

- AWS Account with appropriate permissions
- GitHub repository with admin access
- `kubectl` and `helm` CLI tools
- AWS CLI configured

## Step 1: AWS Infrastructure Setup

### 1.1 Create ECR Repository
```bash
# Create ECR repository for backend images
aws ecr create-repository \
  --repository-name customer-api \
  --region us-east-1 \
  --image-scanning-configuration scanOnPush=true

# Note the repository URI for later use
aws ecr describe-repositories --repository-names customer-api --query 'repositories[0].repositoryUri'
```

### 1.2 Create EKS Clusters
```bash
# Development cluster
eksctl create cluster \
  --name tcc-ufu-dev-cluster \
  --region us-east-1 \
  --nodes 2 \
  --node-type t3.medium \
  --managed

# Production cluster  
eksctl create cluster \
  --name tcc-ufu-prod-cluster \
  --region us-east-1 \
  --nodes 3 \
  --node-type t3.large \
  --managed
```

### 1.3 Install AWS Load Balancer Controller
```bash
# For both dev and prod clusters
for CLUSTER in tcc-ufu-dev-cluster tcc-ufu-prod-cluster; do
  aws eks update-kubeconfig --region us-east-1 --name $CLUSTER
  
  # Create IAM service account
  eksctl create iamserviceaccount \
    --cluster=$CLUSTER \
    --namespace=kube-system \
    --name=aws-load-balancer-controller \
    --role-name "AmazonEKSLoadBalancerControllerRole-$CLUSTER" \
    --attach-policy-arn=arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess \
    --approve
  
  # Install AWS Load Balancer Controller
  helm repo add eks https://aws.github.io/eks-charts
  helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
    -n kube-system \
    --set clusterName=$CLUSTER \
    --set serviceAccount.create=false \
    --set serviceAccount.name=aws-load-balancer-controller
done
```

### 1.4 Create DynamoDB Tables
```bash
# Development table
aws dynamodb create-table \
  --table-name Customers-dev \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Production table
aws dynamodb create-table \
  --table-name Customers-prod \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Step 2: IAM Setup for GitHub Actions

### 2.1 Create GitHub Actions IAM User
```bash
# Create IAM user for GitHub Actions
aws iam create-user --user-name github-actions-backend-ci-cd

# Create access keys (save these for GitHub secrets)
aws iam create-access-key --user-name github-actions-backend-ci-cd
```

### 2.2 Create IAM Policy
```bash
# Create policy file
cat > github-actions-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRPermissions",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EKSPermissions",
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DynamoDBPermissions",
      "Effect": "Allow",
      "Action": [
        "dynamodb:DescribeTable",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/Customers-dev",
        "arn:aws:dynamodb:us-east-1:*:table/Customers-prod"
      ]
    }
  ]
}
EOF

# Create and attach policy
aws iam create-policy \
  --policy-name GitHubActionsBackendPolicy \
  --policy-document file://github-actions-policy.json

aws iam attach-user-policy \
  --user-name github-actions-backend-ci-cd \
  --policy-arn arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/GitHubActionsBackendPolicy
```

### 2.3 Create EKS Access
```bash
# Get the IAM user ARN
USER_ARN=$(aws iam get-user --user-name github-actions-backend-ci-cd --query 'User.Arn' --output text)

# For both clusters, add the user to aws-auth ConfigMap
for CLUSTER in tcc-ufu-dev-cluster tcc-ufu-prod-cluster; do
  aws eks update-kubeconfig --region us-east-1 --name $CLUSTER
  
  # Edit aws-auth ConfigMap to add the user
  kubectl edit configmap aws-auth -n kube-system
  
  # Add this to the mapUsers section:
  # - userarn: $USER_ARN
  #   username: github-actions-user
  #   groups:
  #     - system:masters
done
```

## Step 3: GitHub Repository Configuration

### 3.1 Add GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
```
AWS_ACCESS_KEY_ID=<access-key-from-step-2.1>
AWS_SECRET_ACCESS_KEY=<secret-key-from-step-2.1>
```

### 3.2 Create Environment Protection Rules

#### Development Environment
1. Go to Settings → Environments
2. Create "development" environment
3. No protection rules needed (auto-deploy)

#### Production Environment
1. Create "production" environment
2. Add protection rules:
   - ✅ Required reviewers (add team members)
   - ✅ Deployment branches: `main` only
   - ⏱️ Wait timer: 0 minutes (optional)

### 3.3 Branch Protection Rules
1. Go to Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators

## Step 4: Test the Pipeline

### 4.1 Trigger Development Deployment
```bash
# Make a change to backend code and push to develop
git checkout develop
echo "# Test change" >> backend/README.md
git add backend/README.md
git commit -m "test: trigger pipeline"
git push origin develop
```

### 4.2 Trigger Production Deployment
```bash
# Create PR from develop to main
git checkout main
git pull origin main
git merge develop
git push origin main
```

### 4.3 Monitor Pipeline
```bash
# View pipeline status
gh run list --workflow="Backend CI/CD Pipeline"

# View live logs
gh run watch
```

## Step 5: Verify Deployments

### 5.1 Check Development
```bash
# Connect to dev cluster
aws eks update-kubeconfig --region us-east-1 --name tcc-ufu-dev-cluster

# Check deployment
kubectl get pods -n development
kubectl get svc -n development  
kubectl get ingress -n development

# Get ALB URL
ALB_URL=$(kubectl get ingress customer-api-dev -n development -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "Dev URL: http://$ALB_URL"

# Test API
curl "http://$ALB_URL/customers"
```

### 5.2 Check Production
```bash
# Connect to prod cluster
aws eks update-kubeconfig --region us-east-1 --name tcc-ufu-prod-cluster

# Check deployment
kubectl get pods -n production
kubectl get hpa -n production
kubectl get ingress -n production

# Get ALB URL
ALB_URL=$(kubectl get ingress customer-api-prod -n production -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "Prod URL: https://$ALB_URL"

# Test API
curl "https://$ALB_URL/customers"
```

## Troubleshooting

### Common Setup Issues

1. **ECR Repository Access Denied**
   ```bash
   # Test ECR access
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin \
     <account-id>.dkr.ecr.us-east-1.amazonaws.com
   ```

2. **EKS Access Issues**
   ```bash
   # Verify cluster access
   aws eks describe-cluster --name tcc-ufu-dev-cluster --region us-east-1
   
   # Check aws-auth ConfigMap
   kubectl get configmap aws-auth -n kube-system -o yaml
   ```

3. **Load Balancer Controller Issues**
   ```bash
   # Check controller status
   kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
   
   # View controller logs
   kubectl logs -n kube-system deployment/aws-load-balancer-controller
   ```

4. **DynamoDB Permissions**
   ```bash
   # Test DynamoDB access
   aws dynamodb scan --table-name Customers-dev --max-items 1
   ```

### Pipeline Debug Commands

```bash
# View workflow file
cat .github/workflows/backend-ci-cd.yml

# Test Helm chart locally
cd infrastructure/charts/customer-api
helm template . --values values.yaml

# Validate Kubernetes resources
kubectl apply --dry-run=client -f <manifest-file>

# Check GitHub Actions runner logs
gh run view <run-id> --log
```

## Security Considerations

1. **Rotate AWS Access Keys** regularly
2. **Use least privilege** IAM policies  
3. **Enable CloudTrail** for audit logging
4. **Monitor ECR** for image vulnerabilities
5. **Review GitHub Actions** permissions regularly
6. **Use branch protection** rules consistently

## Cost Optimization

1. **Use spot instances** for development cluster
2. **Auto-scale down** non-production resources
3. **Set up billing alerts** for unexpected costs
4. **Clean up unused ECR images** regularly
5. **Use reserved instances** for production if stable workload

## Next Steps

1. Set up monitoring with CloudWatch/Prometheus
2. Configure log aggregation with ELK or CloudWatch Logs
3. Add security scanning to the pipeline
4. Implement blue-green deployments for zero-downtime
5. Set up disaster recovery procedures