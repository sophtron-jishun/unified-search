const {logger, statsd, http} = require('sph-base');
const config = require('./config')
const s3 = require('sph-s3');
const {processCsv} = require('./utils')
const axios = require('axios')

const s3Client = s3({
  region: config.AwsRegion,
  accessKey: config.DataBucketAccessKey,
  accessKeyId: config.DataBucketAccessKeyId,
  bucket: config.S3Bucket
})
const s3Prefix = `${config.Env}/search/`

const mappingsCache = {}

async function searchInstitutions(name){
  // TODO use own search
  const ret = await http.wget(`${config.AutoSuggestEndpoint}?term=${encodeURIComponent(name)}`, {});
  // console.log(ret);
  return {
    institutions: (ret || []).slice(0, 9).map(ins => ({
      id: ins.value,
      logo_url: ins.img,
      name: ins.label,
      url: ins.url
    }))
  };
}
async function getPreference(partner, noDefault){
  if(partner) {
    logger.trace(`Getting preferences for partner: ${partner}`)
    let ret = await s3Client.GetObject(`${s3Prefix}preferences/${partner}/default.json`, true);
    logger.trace(`Preferences for partner: ${partner}:`, ret)
    if(ret){
      return ret
    }else if(noDefault){
      return {}
    }
  }
  let defaultPref = await http.wget(config.DataBaseUrl + 'preferences/default.json');
  return defaultPref;
}
async function getMappings(key){
  if(mappingsCache[key]){
    return mappingsCache[key];
  }
  logger.info(`Loading mappings: ${key}`)
  const response = await axios.get(config.DataBaseUrl + key, {
    responseType: 'stream'
  }).catch(err => {
    if(err?.response?.status === 404){
      return;
    }
  });
  const stream = response?.data;
  if(!stream){
    return;
  }
  let arr = await processCsv(stream);
  if(!arr){
    return;
  }
  // row_id,institution_name,mxcode,institution_guid,sophtron_institution_id,display_url
  arr.shift(1);
  return mappingsCache[key] = arr.reduce((obj, item) => {
    if(!obj[item[4]]){
      obj[item[4]] = { //sophtron_id
        name: item[1],
        target_id: item[2], //mx_code
        url: item[5],
        provider: 'mx' //TODO, design a convension for mappings and use dynamic value here 
      }
    }
    return obj
  });
}
module.exports = [
  {
    path: 'providers',
    method: 'get',
    func: function(req, res){
      res.send(['sophtron', 'mx'])
    }
  },
  {
    path: 'institutions',
    method: 'get',
    params: ['provider?'],
    func: async function(req, res){
      // let { provider } = req.params;
      let { query, partner } = req.query;
      if(query){
        let ret = await searchInstitutions(query);
        res.send(ret);
        return;
      }else{
        let pref = await getPreference(partner);
        res.send({institutions: pref.defaultBanks})
      }
    }
  },
  {
    path : 'institution/resolve',
    method: 'get',
    params: ['to_provider?'],
    func: async function(req, res){
      let { id, partner } = req.query;
      let { to_provider} = req.params;
      if(!to_provider || to_provider === 'auto'){
        let pref = await getPreference(partner);
        to_provider = pref.providerMapping[id]?.provider;
      }
      if(to_provider){
        let map = await getMappings(`${to_provider}_sophtron.csv`);
        let ret = map?.[id]
        if(ret){
          res.send(ret)
          return;
        }
      }
      res.send({
        target_id: id,
        provider: 'sophtron'
      })
    }
  },
  {
    path : 'preference',
    method: 'get',
    func: async function(req, res){
      let { partner } = req.query;
      let ret = await getPreference(partner, true)
      res.send(ret)
    }
  },
  {
    path : 'preference',
    method: 'put',
    func: async function(req, res){
      let { partner } = req.query;
      //TODO authenticate partner
      if(partner){
        await s3Client.PutObject(`${s3Prefix}preferences/${partner}/default.json`, JSON.stringify(req.body))
        res.sendStatus(200)
        return;
      }
      res.sendStatus(400)
    }
  }
]