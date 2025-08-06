variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "account_id" {
  description = "AWS Account ID"
  type        = string
  default     = "760347630853"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "tcc-ufu"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "table_name" {
  description = "DynamoDB table name"
  type        = string
  default     = "Customers"
}

variable "app_port" {
  description = "Application port"
  type        = string
  default     = "8080"
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.30"
}

variable "node_group_instance_types" {
  description = "EC2 instance types for EKS node group"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_group_desired_size" {
  description = "Desired number of nodes"
  type        = number
  default     = 1
}

variable "node_group_max_size" {
  description = "Maximum number of nodes"
  type        = number
  default     = 2
}

variable "node_group_min_size" {
  description = "Minimum number of nodes"
  type        = number
  default     = 1
}

variable "ecr_repository_url" {
  description = "ECR repository URL for the customer API image"
  type        = string
  default     = "customer-api"
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}

# Istio Configuration Variables
variable "istio_version" {
  description = "Istio version to install"
  type        = string
  default     = "1.21.0"
}

variable "create_default_gateway" {
  description = "Whether to create a default Istio Gateway resource"
  type        = bool
  default     = true
}