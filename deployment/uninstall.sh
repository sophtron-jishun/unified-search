#!/usr/bin/env bash

echo "Usage ./uninstall.sh prod|pre"
#install --replace
#upgrade
${BASH_SOURCE%/*}/../../helm.sh uninstall sph-did-$1 -n sph-eks-$1 prod-svc