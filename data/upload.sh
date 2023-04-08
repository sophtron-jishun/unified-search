#!/usr/bin/env bash
profile=soph_prod_admin
version="20230408_2"
versionJson=$(cat <<-END
  {
    "prod": "$version",
    "pre": "$version",
    "dev": "$version"
  }
END
)
echo $versionJson
echo $versionJson | aws s3 cp --content-type application/json - s3://sophtron-prod-shared-data/search/version.json --profile $profile

aws s3 cp ${BASH_SOURCE%/*}/preferences s3://sophtron-prod-shared-data/search/preferences --recursive --profile soph_prod_admin
aws s3 cp ${BASH_SOURCE%/*}/../application/dataProcessor/raw_data/output/main.csv "s3://sophtron-prod-shared-data/search/db/$version.csv" --profile $profile
