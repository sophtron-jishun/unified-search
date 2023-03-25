const {defineConfig} = require('sph-base');

module.exports = defineConfig({
  LogLevel: 'debug',
  Port: '8080',
  Env: 'dev', //mocked
  Component: 'sph-vc',
  Version: '',

  AutoSuggestEndpoint: 'https://sophtron-prod.com/autoSuggest',

  DataBaseUrl: 'https://sophtron-prod-shared-data.s3.us-west-2.amazonaws.com/search/',

  AwsRegion: 'us-west-2',
  S3Bucket: 'sophtron-prod-data',
  DataBucketAccessKey: '',
  DataBucketAccessKeyId: '',
});

// curl http://localhost:8080/api/vc/transactions/c99bdde6-c17e-4286-acb3-804655e51244 --data accountId=2790a7e4-d8de-4978-9bc6-19bf2d168f67 --data startDate=2000-01-01 -H 'IntegrationKey:e2cbd36a563f4d33be223046dda6fe28ef2a871749214b4584f550c9aca4703cc7e0ed70e85043e3be6dd312833d9413'