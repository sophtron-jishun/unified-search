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
- `curl -X PUT http://localhost:8082/api/preference?partner=sophtron -d @data/preferences/sophtron.json -H 'Content-Type: application/json'`
- `curl http://localhost:8080/api/preference?partner=sophtron`
- `curl https://search.sophtron.com/api/preference?partner=sophtron`
- `curl 'https://search.sophtron.com/api/resolve?id=4b2eca34-a729-438f-844c-ba8ce51047f9&partner=sophtron'`
- `curl 'http://localhost:8080/api/resolve?id=4b2eca34-a729-438f-844c-ba8ce51047f9&partner=sophtron'`

# Pre-Processing data
- `ts-node dataProcessor/tools/mxData.js` this will call MX public api to get a full list of institutions to `raw_data/input/mx.csv` and `raw_data/input/mx-int.csv`
- `node dataProcessor/tools/sophtrongData.js` this will call sophtron api to get the list of institutions to `raw_data/input/sophtron.csv`
- It is expected that an MX shared institution id csv file also in that directory, update the file name in `dataProcessor/tools/merge.js`
- `node dataProcessor/tools/merge.js` this will generate `main.csv` in `raw_data/output/` 
- Optional: enable the commented code in [buildIndex.js](application/dataProcessor/tools/buildIndex.js) and use `node dataProcessor/tools/buildIndex.js` to generate `mainIndex.csv` for manual checking (testing)

# Publishing the data
- Go to [deployment](deployment/) and update the version info for different envs in `upload.sh` then use `./upload.sh -- data` to publish the data
- If a new version is published for the specific env, it takes ~30s that the instance discovers it and update the index  

# Add a new provider
- Name the provider and add to the `providers` array at the top of [merge.js](application/dataProcessor/tools/merge.js)
- Add a corresponding `processProvider` call near the bottom of `merge.js`
- It should handle the new provider and generate the data and mappings to `main.csv`, otherwise, debug.
