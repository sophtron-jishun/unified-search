const {defineConfig} = require('sph-base');

module.exports = defineConfig({
  LogLevel: 'debug',
  Port: '8082',
  Env: 'pre', //mocked
  Component: 'sph-search',
  Version: '',
  DataSuffix: '_20230406',
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

});