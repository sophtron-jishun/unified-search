# Introduction 
Provide a universal institution search and multi-provider mapping service

# Getting Started
- `npm i`
- `npm run start`
- `http://localhost:8080/api/*`
- Tested on node 17

# Deployed to 
- `https://search.sophtron-prod.com`
- `https://search.sophtron.com`

# Examples
- `curl -X PUT https://search.sophtron-prod.com/api/preference?partner=sophtron -d @data/preferences/sophtron.json -H 'Content-Type: application/json'`
- `curl http://localhost:8080/api/preference?partner=sophtron`
- `curl https://search.sophtron.com/api/preference?partner=sophtron`
- `curl 'https://search.sophtron.com/api/resolve?id=4b2eca34-a729-438f-844c-ba8ce51047f9&partner=sophtron'`
- `curl 'http://localhost:8080/api/resolve?id=4b2eca34-a729-438f-844c-ba8ce51047f9&partner=sophtron'`
