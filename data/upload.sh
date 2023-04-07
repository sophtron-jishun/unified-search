#!/usr/bin/env bash

rm ${BASH_SOURCE%/*}/main.csv
cp ${BASH_SOURCE%/*}/../application/dataProcessor/raw_data/output/main.csv ${BASH_SOURCE%/*}/

aws s3 cp ${BASH_SOURCE%/*}/ s3://sophtron-prod-shared-data/search/ --recursive --profile soph_prod_admin
