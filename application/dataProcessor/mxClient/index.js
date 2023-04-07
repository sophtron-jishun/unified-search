const {InstitutionResponse, Configuration, CredentialRequest, MxPlatformApiFactory} = require('./sdk');
const config = require('../../config');
const { logger } = require('sph-base');

const mxConfigInt = {
  username: config.MxApiClientId,
  password: config.MxApiSecret,
  demoUserId: config.MxDemoUserId,
  demoMemberId: config.MxDemoMemberId,
  basePath: 'https://int-api.mx.com',
}

const mxConfigProd = {
  username: config.MxApiClientIdProd,
  password: config.MxApiSecretProd,
  basePath: 'https://api.mx.com',
}

const mx = {
  ...mxConfigProd,
  baseOptions: {
    headers: {
      Accept: 'application/vnd.mx.api.v1+json',
    },
  }
};
const apiClient = MxPlatformApiFactory(new Configuration(mx));
async function batchLoadInstitutions(){
  logger.info(`loading mx institutions`);
  // logger.info(mx);
  const knownTotalPages = 141;
  const all = [];
  const promises = [];
  for(let i = 1; i < knownTotalPages; i++){
    promises.push(
      apiClient.listInstitutions(undefined, i, 100).then(ret => {
        let {pagination, institutions} = ret.data
        //logger.info(ret.data)
        logger.info(`Loaded page ${pagination.current_page}, per_page: ${pagination.processCsv}, total_entries: ${pagination.total_entries}, total_pages: ${pagination.total_pages}`)
        if(institutions.length){
          all.push(...institutions)
        }
      }).catch(err => {
        logger.error(`Error getting mx institutions, page: ${i}`, err)
      })
    )
  }
  await Promise.all(promises);
  logger.info(`loaded ${all.length} mx institutions`);
  return all;
}
module.exports = {
  batchLoadInstitutions
};