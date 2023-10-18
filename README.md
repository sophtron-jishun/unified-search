# Introduction 
Provide a universal institution search and multi-provider mapping service

# Getting Started
- `cd application`
- `npm i`
- `npm run start`
- `http://localhost:8080/api/*`
- Tested on node 17

# Pre-Processing data
- `ts-node dataProcessor/tools/mxData.js` this will call MX public api to get a full list of institutions to `raw_data/input/mx.csv` and `raw_data/input/mx-int.csv`
- `node dataProcessor/tools/sophtrongData.js` this will call sophtron api to get the list of institutions to `raw_data/input/sophtron.csv`
- It is expected that an MX shared institution id csv file also in that directory, update the file name in `dataProcessor/tools/merge.js`
- `node dataProcessor/tools/merge.js` this will generate `main.csv` in `raw_data/output/` 
- Optional: enable the commented code in [buildIndex.js](application/dataProcessor/tools/buildIndex.js) and use `node dataProcessor/tools/buildIndex.js` to generate `mainIndex.csv` for manual checking (testing)

# Publishing the data
- Upload the built index`main.csv` and `index.txt` file to an http accessible url, with a `version.json` as metadata:
```json
  {
    "env": "$version"
  }
```
- Put the url to `DataBaseUrl` in `server/config.js` 
- The server will load the index from the url at start up, then check the version.json with an interval. then update the index if there is a new version
- If a new version is published for the specific env, it takes ~30s that the instance discovers it and update the index  

# Add a new provider
- Name the provider and add to the `providers` array at the top of [merge.js](application/dataProcessor/tools/merge.js)
- Add a corresponding `processProvider` call near the bottom of `merge.js`
- It should handle the new provider and generate the data and mappings to `main.csv`, otherwise, debug.
