#!/usr/bin/env bash

releaseName="sph-search-$1"
namespace="sph-eks-$1"
config="prod-svc"
values=${BASH_SOURCE%/*}/values-$1.yaml
#install=true
source <(curl -s http://dev.sophtron-prod.com.s3-website-us-west-2.amazonaws.com/bash/k8s/deploy.sh)