#!/usr/bin/env bash

aws s3 cp ${BASH_SOURCE%/*}/ s3://sophtron-prod-shared-data/search/ --recursive --profile soph_prod_admin
