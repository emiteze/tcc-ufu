# GitHub Actions CI/CD Pipelines

This directory contains GitHub Actions workflows for automated CI/CD of the TCC-UFU Customer Management System.

## Overview

### Backend Pipeline (`backend-ci-cd.yml`)

A comprehensive CI/CD pipeline that handles the complete backend deployment workflow from code commit to production.

## Pipeline Stages

### 1. 🔍 Build and Test
- **Triggers**: Push/PR to `main`/`develop` with changes in `backend/`
- **Actions**:
  - Checkout code and setup Go environment
  - Cache Go modules for faster builds
  - Install dependencies (`make deps`)
  - Format code (`make fmt`)
  - Run linters (`make lint`)
  - Execute unit tests with coverage (`make test-coverage`)
  - Generate semantic version tags
- **Outputs**: Version number, deployment decision

### 2. 🐳 Build and Push Docker Image
- **Condition**: Only on successful tests + push to main/develop
- **Actions**:
  - Build Docker image from backend code
  - Login to Amazon ECR
  - Tag with version and `latest`
  - Push to ECR repository
- **Outputs**: ECR image URI

### 3. 🚀 Deploy to Development
- **Environment**: `development` 
- **Actions**:
  - Configure kubectl for EKS dev cluster
  - Deploy using Helm chart with dev-specific values
  - Wait for ALB provisioning
  - Verify deployment health
- **Outputs**: Dev environment URL

### 4. 🧪 End-to-End Testing
- **Dependencies**: Successful dev deployment
- **Actions**:
  - Setup Node.js and install Playwright
  - Wait for dev environment readiness
  - Run full integration test suite against dev
  - Upload test results and reports
- **Critical**: Production deployment blocked if E2E tests fail

### 5. 🌟 Deploy to Production
- **Conditions**: 
  - Only on `main` branch
  - All previous stages successful
  - Manual environment approval
- **Actions**:
  - Deploy to production EKS cluster
  - Use production-grade configurations (3 replicas, auto-scaling)
  - Perform production smoke tests
  - Verify deployment health

### 6. 📢 Notification & Summary
- **Actions**:
  - Create deployment status summary
  - Generate GitHub step summary with results
  - Determine overall deployment status

## Required Secrets

Configure these in your GitHub repository settings:

```bash
# AWS Credentials
DEV_AWS_ACCESS_KEY_ID=<your-aws-access-key>
DEV_AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
PROD_AWS_ACCESS_KEY_ID=<your-aws-access-key>
PROD_AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
```

## Required AWS Resources

### ECR Repository
```bash
aws ecr create-repository \
  --repository-name customer-api \
  --region us-east-1
```

### EKS Clusters
- `tcc-ufu-dev-cluster` (Development)
- `tcc-ufu-prod-cluster` (Production)

### DynamoDB Tables
- `Customers-dev` (Development)
- `Customers-prod` (Production)

## Environment Configuration

### Development Environment
- **Namespace**: `development`
- **Replicas**: 1
- **DynamoDB**: `Customers-dev`
- **Auto-scaling**: Disabled
- **ALB Tags**: `Environment=dev,Project=tcc-ufu`

### Production Environment
- **Namespace**: `production`
- **Replicas**: 3 (with auto-scaling 3-10)
- **DynamoDB**: `Customers-prod`
- **Resources**: Higher CPU/memory limits
- **ALB Tags**: `Environment=prod,Project=tcc-ufu`

## Workflow Behavior

### Pull Requests
- ✅ Build and test
- ❌ No deployment
- 📊 Test results in PR comments

### Push to `develop` branch
- ✅ Build, test, build image
- ✅ Deploy to development
- ✅ Run E2E tests
- ❌ No production deployment

### Push to `main` branch
- ✅ Complete pipeline including production
- ⚠️ Production requires manual approval
- 🔒 E2E tests must pass for production deployment

## Version Strategy

Versions follow the pattern:
- **Main branch**: `v20231201-abc1234` 
- **Develop branch**: `v20231201-abc1234-dev`

Format: `v{YYYYMMDD}-{short-sha}[-dev]`

## Monitoring & Debugging

### Check Pipeline Status
```bash
# View workflow runs
gh run list --workflow="Backend CI/CD Pipeline"

# View specific run
gh run view <run-id>

# View logs for specific job
gh run view <run-id> --job="Build and Test"
```

### Access Deployed Applications
```bash
# Get dev environment URL
kubectl get ingress customer-api-dev -n development

# Get production environment URL  
kubectl get ingress customer-api-prod -n production

# Port forward for local access
kubectl port-forward -n development svc/customer-api-dev 8080:80
```

### View Deployment Status
```bash
# Development
kubectl get pods -n development -l app.kubernetes.io/name=customer-api
kubectl describe deployment customer-api-dev -n development

# Production
kubectl get pods -n production -l app.kubernetes.io/name=customer-api
kubectl get hpa -n production
```

## Artifacts

The pipeline generates these artifacts:
- **Test Results**: Unit test coverage reports
- **E2E Reports**: Playwright test results and HTML reports
- **Docker Images**: Pushed to ECR with version tags

## Security Features

- ✅ **OIDC Authentication** with AWS (no long-lived keys in workflows)
- ✅ **Environment Protection** rules for production
- ✅ **Branch Protection** ensures code review before main
- ✅ **Secrets Management** through GitHub encrypted secrets
- ✅ **Least Privilege** IAM roles for deployments

## Troubleshooting

### Common Issues

1. **ECR Push Fails**
   - Check AWS credentials configuration
   - Verify ECR repository exists
   - Ensure IAM permissions for ECR operations

2. **Helm Deployment Fails**
   - Verify EKS cluster connectivity
   - Check Helm chart values and templates
   - Review Kubernetes resources and events

3. **E2E Tests Fail**
   - Check dev environment accessibility
   - Verify test data and database state
   - Review Playwright test logs

4. **ALB Not Ready**
   - AWS Load Balancer Controller must be installed
   - Check VPC and subnet configurations
   - Verify security group rules

### Debug Commands
```bash
# Check workflow file syntax
gh workflow view backend-ci-cd.yml

# Test Helm chart locally
helm template customer-api infrastructure/charts/customer-api \
  --values infrastructure/charts/customer-api/values.yaml

# Validate Kubernetes manifests
kubectl apply --dry-run=client -f <generated-manifests>
```

## Performance Optimizations

- **Go Module Caching**: Speeds up dependency installation
- **Docker Layer Caching**: Reduces image build time
- **Parallel Jobs**: Independent stages run concurrently
- **Conditional Deployments**: Skip unnecessary steps
- **Artifact Retention**: Configurable cleanup policies

## Best Practices

1. **Always test changes** in feature branches first
2. **Use semantic versioning** for releases
3. **Monitor pipeline metrics** and success rates
4. **Keep secrets updated** and rotate regularly
5. **Review failed deployments** immediately
6. **Use environment protection** rules for production
7. **Document configuration changes** in commit messages