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
  MaxSearchResults: 20,
  DataLoadIntervalSeconds: 30,
  RedisServer: 'redis://localhost:6379',
  RedisCacheTimeSeconds: 600,
  SophtronAnalyticsServiceEndpoint: 'http://localhost:8081/api/',

  DataBaseUrl: '',

  AwsRegion: 'us-west-2',
  S3Bucket: '',
  DataBucketAccessKey: '',
  DataBucketAccessKeyId: '',
};;

const arr = Object.keys(config);
for (let i = 0; i < arr.length; i++) {
  const key = arr[i];
  config[key] = processEnv[key.toUpperCase()] || config[key];
}
module.exports = config;