#!/usr/bin/env bash

profile=soph_prod_admin

aws s3 cp ${BASH_SOURCE%/*}/../openapi/ s3://static.sophtron.com/docs/openapi/search/ --recursive --profile $profile
aws s3 cp ${BASH_SOURCE%/*}/../openapi/ s3://static.sophtron-prod.com/docs/openapi/search/ --recursive --profile $profile

source <(curl -s http://dev.sophtron-prod.com.s3-website-us-west-2.amazonaws.com/bash/doc-svc-list.sh)
