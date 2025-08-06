module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.11"

  cluster_name                   = "${local.name}-cluster"
  cluster_version                = var.kubernetes_version
  cluster_endpoint_public_access = true

  # Give the Terraform identity admin access to the cluster
  # which will allow resources to be deployed into the cluster
  enable_cluster_creator_admin_permissions = true

  cluster_addons = {
    coredns    = {}
    kube-proxy = {}
    vpc-cni    = {}
  }

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    main = {
      name = "${local.name}-node-group"

      instance_types = ["t3.medium"]

      min_size     = 1
      max_size     = 4
      desired_size = 2
      capacity_type = "SPOT"
    }
  }

  #  EKS K8s API cluster needs to be able to talk with the EKS worker nodes with port 15017/TCP and 15012/TCP which is used by Istio
  #  Istio in order to create sidecar needs to be able to communicate with webhook and for that network passage to EKS is needed.
  node_security_group_additional_rules = {
    ingress_15017 = {
      description                   = "Cluster API - Istio Webhook namespace.sidecar-injector.istio.io"
      protocol                      = "TCP"
      from_port                     = 15017
      to_port                       = 15017
      type                          = "ingress"
      source_cluster_security_group = true
    }
    ingress_15012 = {
      description                   = "Cluster API to nodes ports/protocols"
      protocol                      = "TCP"
      from_port                     = 15012
      to_port                       = 15012
      type                          = "ingress"
      source_cluster_security_group = true
    }
  }

  tags = local.tags
}

################################################################################
# EKS Blueprints Addons
################################################################################

resource "aws_eks_addon" "solo-io_istio-distro" {
  cluster_name                = local.cluster_name
  addon_name                  = "solo-io_istio-distro"
  resolve_conflicts_on_update = "OVERWRITE"
  addon_version               = local.istio_addon_version
  configuration_values = jsonencode({
    meshConfig : {
      accessLogFile : "/dev/stdout"
    },
    pilot : {
      autoscaleEnabled : false,
      replicaCount : 1
    }
  })
}