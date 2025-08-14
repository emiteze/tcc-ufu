# Istio Ingress Gateway and related resources

# Create istio-ingress namespace
resource "kubernetes_namespace" "istio_ingress" {
  metadata {
    name = "istio-ingress"
    labels = {
      "istio-injection" = "enabled"
    }
  }
}

# Istio Ingress Gateway Deployment
resource "kubernetes_deployment" "istio_ingress_gateway" {
  metadata {
    name      = "istio-ingressgateway"
    namespace = kubernetes_namespace.istio_ingress.metadata[0].name
    labels = {
      app    = "istio-ingressgateway"
      istio  = "ingressgateway"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app   = "istio-ingressgateway"
        istio = "ingressgateway"
      }
    }

    template {
      metadata {
        labels = {
          app   = "istio-ingressgateway"
          istio = "ingressgateway"
        }
        annotations = {
          "sidecar.istio.io/inject" = "false"
        }
      }

      spec {
        service_account_name = kubernetes_service_account.istio_ingressgateway.metadata[0].name
        
        container {
          name  = "istio-proxy"
          image = "istio/proxyv2:1.26.0"
          
          args = [
            "proxy",
            "router",
            "--domain",
            "$(POD_NAMESPACE).svc.cluster.local",
            "--proxyLogLevel=warning",
            "--proxyComponentLogLevel=misc:error",
            "--log_output_level=default:info",
          ]
          
          port {
            container_port = 15021
            protocol       = "TCP"
            name          = "status-port"
          }
          
          port {
            container_port = 8080
            protocol       = "TCP"
            name          = "http2"
          }
          
          port {
            container_port = 8443
            protocol       = "TCP"
            name          = "https"
          }
          
          port {
            container_port = 15090
            protocol       = "TCP"
            name          = "http-envoy-prom"
          }

          env {
            name  = "JWT_POLICY"
            value = "third-party-jwt"
          }
          
          env {
            name  = "PILOT_CERT_PROVIDER"
            value = "istiod"
          }
          
          env {
            name  = "CA_ADDR"
            value = "istiod.istio-system.svc:15012"
          }
          
          env {
            name = "NODE_NAME"
            value_from {
              field_ref {
                api_version = "v1"
                field_path  = "spec.nodeName"
              }
            }
          }
          
          env {
            name = "POD_NAME"
            value_from {
              field_ref {
                api_version = "v1"
                field_path  = "metadata.name"
              }
            }
          }
          
          env {
            name = "POD_NAMESPACE"
            value_from {
              field_ref {
                api_version = "v1"
                field_path  = "metadata.namespace"
              }
            }
          }
          
          env {
            name = "INSTANCE_IP"
            value_from {
              field_ref {
                api_version = "v1"
                field_path  = "status.podIP"
              }
            }
          }
          
          env {
            name = "HOST_IP"
            value_from {
              field_ref {
                api_version = "v1"
                field_path  = "status.hostIP"
              }
            }
          }
          
          env {
            name  = "ISTIO_META_WORKLOAD_NAME"
            value = "istio-ingressgateway"
          }
          
          env {
            name  = "ISTIO_META_OWNER"
            value = "kubernetes://apis/apps/v1/namespaces/istio-ingress/deployments/istio-ingressgateway"
          }
          
          env {
            name  = "ISTIO_META_MESH_ID"
            value = "cluster.local"
          }
          
          env {
            name  = "TRUST_DOMAIN"
            value = "cluster.local"
          }
          
          env {
            name  = "ISTIO_META_UNPRIVILEGED_POD"
            value = "true"
          }
          
          env {
            name  = "ISTIO_META_CLUSTER_ID"
            value = "Kubernetes"
          }

          readiness_probe {
            failure_threshold = 30
            http_get {
              path   = "/healthz/ready"
              port   = 15021
              scheme = "HTTP"
            }
            initial_delay_seconds = 1
            period_seconds        = 2
            success_threshold     = 1
            timeout_seconds       = 1
          }
          
          liveness_probe {
            failure_threshold = 3
            http_get {
              path   = "/healthz/ready"
              port   = 15021
              scheme = "HTTP"
            }
            initial_delay_seconds = 1
            period_seconds        = 10
            success_threshold     = 1
            timeout_seconds       = 1
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "128Mi"
            }
            limits = {
              cpu    = "2000m"
              memory = "1024Mi"
            }
          }

          volume_mount {
            name       = "workload-socket"
            mount_path = "/var/run/secrets/workload-spiffe-uds"
          }
          
          volume_mount {
            name       = "credential-socket"
            mount_path = "/var/run/secrets/credential-uds"
          }
          
          volume_mount {
            name       = "workload-certs"
            mount_path = "/var/run/secrets/workload-spiffe-credentials"
          }
          
          volume_mount {
            name       = "istio-envoy"
            mount_path = "/etc/istio/proxy"
          }
          
          volume_mount {
            name       = "istio-data"
            mount_path = "/var/lib/istio/data"
          }
          
          volume_mount {
            name       = "istio-podinfo"
            mount_path = "/etc/istio/pod"
          }
          
          volume_mount {
            name       = "istio-token"
            mount_path = "/var/run/secrets/tokens"
            read_only  = true
          }
          
          volume_mount {
            name       = "istiod-ca-cert"
            mount_path = "/var/run/secrets/istio"
            read_only  = true
          }
        }

        volume {
          name = "workload-socket"
          empty_dir {}
        }
        
        volume {
          name = "credential-socket"
          empty_dir {}
        }
        
        volume {
          name = "workload-certs"
          empty_dir {}
        }
        
        volume {
          name = "istio-envoy"
          empty_dir {}
        }
        
        volume {
          name = "istio-data"
          empty_dir {}
        }
        
        volume {
          name = "istio-podinfo"
          downward_api {
            items {
              path = "labels"
              field_ref {
                field_path = "metadata.labels"
              }
            }
            items {
              path = "annotations"
              field_ref {
                field_path = "metadata.annotations"
              }
            }
          }
        }
        
        volume {
          name = "istio-token"
          projected {
            sources {
              service_account_token {
                path               = "istio-token"
                expiration_seconds = 43200
                audience          = "istio-ca"
              }
            }
          }
        }
        
        volume {
          name = "istiod-ca-cert"
          config_map {
            name = "istio-ca-root-cert"
          }
        }
      }
    }
  }

  depends_on = [kubernetes_service_account.istio_ingressgateway]
}

# Service Account for Istio Ingress Gateway
resource "kubernetes_service_account" "istio_ingressgateway" {
  metadata {
    name      = "istio-ingressgateway"
    namespace = kubernetes_namespace.istio_ingress.metadata[0].name
    labels = {
      app   = "istio-ingressgateway"
      istio = "ingressgateway"
    }
  }
}

# Istio Ingress Gateway Service
resource "kubernetes_service" "istio_ingressgateway" {
  metadata {
    name      = "istio-ingressgateway"
    namespace = kubernetes_namespace.istio_ingress.metadata[0].name
    labels = {
      app                   = "istio-ingressgateway"
      istio                = "ingressgateway"
      "app.kubernetes.io/managed-by" = "terraform"
    }
    annotations = {
      "service.beta.kubernetes.io/aws-load-balancer-type" = "nlb"
      "service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled" = "true"
      "service.beta.kubernetes.io/aws-load-balancer-nlb-target-type" = "ip"
      "service.beta.kubernetes.io/aws-load-balancer-scheme" = "internet-facing"
    }
  }

  spec {
    type = "LoadBalancer"
    
    port {
      name        = "status-port"
      port        = 15021
      protocol    = "TCP"
      target_port = 15021
    }
    
    port {
      name        = "http2"
      port        = 80
      protocol    = "TCP"
      target_port = 8080
    }
    
    port {
      name        = "https"
      port        = 443
      protocol    = "TCP"
      target_port = 8443
    }

    selector = {
      app   = "istio-ingressgateway"
      istio = "ingressgateway"
    }
  }

  depends_on = [kubernetes_deployment.istio_ingress_gateway]
}

# Note: Customer Gateway and VirtualService resources have been moved to istio-post-cluster.tf
# This avoids the chicken-and-egg problem where Kubernetes manifests are evaluated before the cluster exists