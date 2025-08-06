#!/bin/bash

terraform destroy -target='module.eks_blueprints_addons.helm_release.this["istio-ingress"]'
terraform destroy -target="module.eks_blueprints_addons"
terraform destroy -target="module.eks"
terraform destroy