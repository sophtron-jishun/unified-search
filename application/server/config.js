const processEnv = {};
const envs = {...process.env, ...process.client_envs};
Object.keys(envs).forEach((k) => {
  processEnv[k.toUpperCase()] = envs[k];
});
const config = {
  LogLevel: 'debug',
  Port: '8082',
  Env: 'pre', //mocked
  Component: 'unified-search',
  Version: '',
  MaxSearchResults: 50,
  DataLoadIntervalSeconds: 30,
  RedisServer: 'redis://localhost:6379',
  RedisCacheTimeSeconds: 600,
  SophtronAnalyticsServiceEndpoint: 'https://ucp-analytics.sophtron-prod.com/api/',
  AuthServiceEndpoint: 'https://ucp-login.sophtron-prod.com/api',

  DataBaseUrl: 'http://static.universalconnectproject.org.s3.us-west-2.amazonaws.com/search/',
  S3Bucket: 'dev.universalconnectproject.org',
  AwsRegion: 'us-west-2',
};;

const arr = Object.keys(config);
for (let i = 0; i < arr.length; i++) {
  const key = arr[i];
  config[key] = processEnv[key.toUpperCase()] || config[key];
}
module.exports = config;