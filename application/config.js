const {defineConfig} = require('sph-base');

module.exports = defineConfig({
  LogLevel: 'debug',
  Port: '8082',
  Env: 'pre', //mocked
  Component: 'sph-search',
  Version: '',
  DataSuffix: '_20230604',
  CsvEscape: '^',
  MaxSearchResults: 20,
  DataLoadIntervalSeconds: 30,
  RedisServer: 'redis://localhost:6379',
  RedisCacheTimeSeconds: 600,
  SophtronAnalyticsServiceEndpoint: 'http://localhost:8081/api/',

  DataBaseUrl: 'https://sophtron-prod-shared-data.s3.us-west-2.amazonaws.com/search/',

  AwsRegion: 'us-west-2',
  S3Bucket: 'sophtron-prod-data',
  DataBucketAccessKey: '',
  DataBucketAccessKeyId: '',

  // for data processors
  SophtronApiUserId: '',
  SophtronApiUserSecret: '',
  MxApiSecret:'',
  MxApiSecretProd:'',
  MxApiClientId:'861c3518-79df-4ed2-99cc-a21637694ea6',
  MxApiClientIdProd:'cb102a7c-14a2-4b4a-8241-076d5eedd115',
});