const path = require('path');

const processEnv = {};
const envs = {...process.env, ...process.client_envs};
Object.keys(envs).forEach((k) => {
  processEnv[k.toUpperCase()] = envs[k];
});
const config = {
  LogLevel: 'debug',
  Env: 'pre', //mocked
  Component: 'unified-search',
  Version: '',
  DataSuffix: '_20230604',
  CsvEscape: '^',

  institutionDataPath: path.resolve(path.join(__dirname, '../../../ucp-infrastructure/helm/unified-search/institutionList')),

  // for data processors
  SophtronApiUserId: '',
  SophtronApiUserSecret: '',

  MxApiSecret:'',
  MxApiSecretProd:'',
  MxClientId:'',
  MxClientIdProd:'',

  AkoyaClientId:'',
  AkoyaApiSecret: '', 
  AkoyaClientIdProd: '',
  AkoyaApiSecretProd: '',

  FinicityPartnerId: '',
  FinicityAppKey: '',
  FinicitySecret: '',
  FinicityPartnerIdProd: '',
  FinicityAppKeyProd: '',
  FinicitySecretProd: '',
}

const arr = Object.keys(config);
for (let i = 0; i < arr.length; i++) {
  const key = arr[i];
  config[key] = processEnv[key.toUpperCase()] || config[key];
}
module.exports = config;