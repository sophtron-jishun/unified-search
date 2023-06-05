#!/usr/bin/env bash

version=20230603ARM1

case $1 in 
  "-b")

    CODEARTIFACT_DOMAIN="sophtron-dev"
    AWS_ACCOUNT_ID="156013518325"
    CODEARTIFACT_AUTH_TOKEN=$(aws codeartifact get-authorization-token --domain "${CODEARTIFACT_DOMAIN}" --domain-owner "${AWS_ACCOUNT_ID}" --profile soph_prod_admin --query authorizationToken --output text)

    docker build \
    -t 156013518325.dkr.ecr.us-west-2.amazonaws.com/sophtron/svc-search:$version \
    -t sph_search \
    --build-arg NPM_TOKEN=${CODEARTIFACT_AUTH_TOKEN} \
    ${BASH_SOURCE%/*}/../application

    ;; 

  "-p")
    
    docker push 156013518325.dkr.ecr.us-west-2.amazonaws.com/sophtron/svc-search:$version

    ;;

  *)
    echo Usage: "-b for build, -p for push"
    
    ;;
esac