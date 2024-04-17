# Introduction 
Provide a universal institution search and multi-provider mapping service

# Getting Started
- `cd application`
- `npm i`
- `npm run dev`
- `http://localhost:8082/api/*`
- Tested on node 17

By default the service has only one dependency: 
- Ensure the index data source url as `DataBaseUrl` in [config.js](./application/server/config.js), this is Optional:
  The existing confing value points to ucp hosted cdn. which is public accessible to use. although, it is rapidly updated, you might want to pull and cache your version.
- The server will load the index from the url at start up, then check the version.json at an interval. then update the index if there is a new version
- If a new version is published for the specific env, it takes ~30s that the instance discovers it and update the index  

In addition:
- If you'd like to use the `preference` feature with which you can use API to upload and query your preference, config the `S3Bucket` value in `config.js` and grant the app with necessary permissions.
- Otherwise update the [defaultPreference.js](./application/server/defaultPreference.js) with your preference. 
- the default provider is configured through a shortcut `LocalDefaultProvider` in `config.js` which overwrites the `defaultPreference.js`
