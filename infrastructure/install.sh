#!/bin/bash

terraform init
terraform plan
terraform apply
kubectl rollout restart deployment istio-ingress -n istio-ingress