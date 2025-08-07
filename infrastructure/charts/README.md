# Customer Management Helm Charts

This directory contains Helm charts for deploying the complete Customer Management System to AWS EKS.

## Architecture Overview

The system uses **AWS Application Load Balancer (ALB)** through Kubernetes Ingress to route traffic:

- **Frontend (React)**: Serves static files and handles `/` root path
- **Backend (Go API)**: Handles API endpoints `/api/*` and `/customers/*`
- **Single ALB**: Routes traffic to both services based on path

## Chart Structure

```
charts/
├── customer-management/     # Parent umbrella chart
│   ├── Chart.yaml
│   └── values.yaml
├── customer-api/           # Backend API chart
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
└── customer-frontend/      # Frontend React app chart
    ├── Chart.yaml
    ├── values.yaml
    └── templates/
```

## Deployment

### Option 1: Deploy Complete System (Recommended)
```bash
# Deploy both frontend and backend together
helm install customer-management ./customer-management

# Or with custom values
helm install customer-management ./customer-management \
  --set global.domain=customer-app.example.com \
  --set customer-frontend.config.apiUrl=https://customer-app.example.com
```

### Option 2: Deploy Components Separately
```bash
# Deploy backend only
helm install customer-api ./customer-api

# Deploy frontend only  
helm install customer-frontend ./customer-frontend \
  --set config.apiUrl=https://your-api-endpoint.com
```

## Traffic Routing

The ALB routes traffic using ingress groups and path-based routing:

1. **Frontend Ingress** (Order: 100, Priority: Higher)
   - Path: `/` (catches all unmatched routes)
   - Serves React SPA and handles client-side routing

2. **Backend Ingress** (Order: 200, Priority: Lower)  
   - Paths: `/api/*`, `/customers/*`
   - Serves REST API endpoints

## Key Features

### Frontend (customer-frontend)
- **React + TypeScript** application
- **Nginx** serves static files in container
- **Health endpoint**: `/health`
- **Environment variable**: `REACT_APP_API_URL` for backend URL

### Backend (customer-api)
- **Go + Gin** REST API
- **DynamoDB** integration
- **Health endpoint**: `/customers`
- **Environment variables**: AWS region, DynamoDB table name

### Shared ALB Configuration
- **Internet-facing** load balancer
- **Path-based routing** for frontend vs API
- **Health checks** for both services
- **Auto-scaling** support

## Environment Variables

### Frontend Configuration
```yaml
customer-frontend:
  config:
    apiUrl: "https://your-domain.com"  # Backend API URL
```

### Backend Configuration  
```yaml
customer-api:
  config:
    awsRegion: "us-east-1"
    tableName: "Customers" 
    port: "8080"
```

## AWS Resources Created

1. **Application Load Balancer (ALB)**
   - Created by AWS Load Balancer Controller
   - Internet-facing with automatic DNS

2. **Target Groups**
   - One for frontend service (port 80)
   - One for backend service (port 80)

3. **EKS Services**
   - ClusterIP services for both frontend and backend
   - Service discovery within cluster

## Monitoring & Health Checks

Both services include:
- **Liveness probes** - Restart container if unhealthy
- **Readiness probes** - Remove from load balancer if not ready
- **ALB health checks** - Load balancer level health monitoring

## Scaling

Configure horizontal pod autoscaling:

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

## Troubleshooting

### Check ALB Status
```bash
kubectl get ingress
kubectl describe ingress customer-frontend
kubectl describe ingress customer-api
```

### Check Pod Status
```bash
kubectl get pods
kubectl logs -f deployment/customer-frontend
kubectl logs -f deployment/customer-api
```

### Check Services
```bash
kubectl get svc
kubectl port-forward svc/customer-frontend 3000:80
kubectl port-forward svc/customer-api 8080:80
```