# AWS Configuration
aws_region = "us-east-1"
account_id = "760347630853"

# Project Configuration
project_name = "tcc-ufu"
environment  = "dev"

# DynamoDB Configuration
table_name = "Customers"

# Application Configuration
app_port = "8080"

# EKS Configuration
kubernetes_version = "1.30"

# Node Group Configuration
node_group_instance_types = ["t3.medium"]
node_group_desired_size   = 2
node_group_max_size       = 4
node_group_min_size       = 1

# Container Image Configuration
ecr_repository_url = "760347630853.dkr.ecr.us-east-1.amazonaws.com/customer-api"
image_tag          = "latest"