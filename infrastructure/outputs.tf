output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ids attached to the cluster control plane"
  value       = module.eks.cluster_security_group_id
}

output "cluster_iam_role_name" {
  description = "IAM role name associated with EKS cluster"
  value       = module.eks.cluster_iam_role_name
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "cluster_name" {
  description = "The name/id of the EKS cluster"
  value       = module.eks.cluster_name
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster for the OpenID Connect identity provider"
  value       = module.eks.cluster_oidc_issuer_url
}

output "node_groups" {
  description = "EKS node groups"
  value       = module.eks.eks_managed_node_groups
}

output "vpc_id" {
  description = "ID of the VPC where the cluster is deployed"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.customers.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.customers.arn
}


output "pod_role_arn" {
  description = "ARN of the pod IAM role"
  value       = aws_iam_role.pod_role.arn
}

output "configure_kubectl" {
  description = "Configure kubectl: make sure you're logged in with the correct AWS profile and run the following command to update your kubeconfig"
  value       = "aws eks --region ${local.region} update-kubeconfig --name ${module.eks.cluster_name}"
}

output "eks_addon_verification_commands" {
  description = "Commands to verify EKS add-ons after deployment"
  value       = <<-EOT
  # Check add-on status:
  aws eks describe-addon --cluster-name ${module.eks.cluster_name} --addon-name vpc-cni
  aws eks describe-addon --cluster-name ${module.eks.cluster_name} --addon-name kube-proxy
  aws eks describe-addon --cluster-name ${module.eks.cluster_name} --addon-name coredns
  
  # Verify pods are running:
  kubectl get pods -n kube-system -l app=aws-node
  kubectl get pods -n kube-system -l k8s-app=kube-proxy
  kubectl get pods -n kube-system -l k8s-app=kube-dns
  EOT
}

# Istio Outputs
output "istio_version" {
  description = "Version of Istio installed"
  value       = var.istio_version
}

output "istio_ingress_gateway_service" {
  description = "Service name of Istio ingress gateway"
  value       = "istio-ingress"
}

output "istio_verification_commands" {
  description = "Commands to verify Istio installation"
  value       = <<-EOT
  # Check Istio installation status:
  kubectl get pods -n istio-system
  kubectl get pods -n istio-ingress
  
  # Verify Istio components:
  kubectl get svc -n istio-system
  kubectl get svc -n istio-ingress
  
  # Check Istio configuration:
  kubectl get gateway -A
  kubectl get virtualservice -A
  kubectl get destinationrule -A
  
  # Get Istio ingress gateway external IP:
  kubectl get svc -n istio-ingress -o wide
  
  # Test Istio proxy status (run from a pod with istio-proxy):
  istioctl proxy-status
  
  # Analyze Istio configuration:
  istioctl analyze
  EOT
}

# Istio Gateway Outputs
output "istio_gateway_service" {
  description = "Istio Gateway service details"
  value = {
    name      = kubernetes_service.istio_ingressgateway.metadata[0].name
    namespace = kubernetes_service.istio_ingressgateway.metadata[0].namespace
  }
}

output "customer_app_url" {
  description = "Customer application URL (will be available after LoadBalancer provisioning)"
  value       = "http://[LOAD_BALANCER_DNS]"
}

output "istio_gateway_verification_commands" {
  description = "Commands to verify Istio Gateway deployment"
  value       = <<-EOT
  # Get Istio Gateway external IP:
  kubectl get svc -n istio-ingress istio-ingressgateway
  
  # Check Gateway status:
  kubectl get gateway -n istio-ingress
  kubectl get virtualservice -n istio-ingress
  
  # Test the endpoints (replace EXTERNAL-IP with actual LoadBalancer IP):
  curl http://EXTERNAL-IP/health          # Backend health
  curl http://EXTERNAL-IP/customers       # Backend API  
  curl http://EXTERNAL-IP/                # Frontend app
  
  # Check Istio proxy status:
  kubectl get pods -n istio-ingress
  EOT
}