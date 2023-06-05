const {logger, statsd, http} = require('sph-base');
const config = require('./config')
const s3 = require('sph-s3');
const cache = require('sph-redis');
const utils = require('./utils')
const axios = require('axios')
const tools = require('./dataProcessor/tools')

const s3Client = s3({
  region: config.AwsRegion,
  accessKey: config.DataBucketAccessKey,
  accessKeyId: config.DataBucketAccessKeyId,
  bucket: config.S3Bucket
})

const s3Prefix = `${config.Env}/search/`

let db = {
}
let defaultPref;

function weightByPerformance(metrics, pref){
  let { weights_conf = defaultPref.weights_conf } = (pref || {} ); 
  let weights = metrics.providers;
  for( let [provider, metric] of Object.entries(metrics.providers)){
    weights[provider].weight = 0;
    let value = metric.success_rate[weights_conf.success_rate.use_field];
    for( let conf of weights_conf.success_rate.buckets){
      if(conf.from <= value && conf.to > value){
        weights[provider].weight += (conf.weight * weights_conf.success_rate.ratio);
      }
    }
    value = metric.time_cost[weights_conf.time_cost.use_field];
    for( let conf of weights_conf.time_cost.buckets){
      if(conf.from <= value && conf.to > value){
        weights[provider].weight += (conf.weight * weights_conf.time_cost.ratio);
      }
    }
  }
  let selected_provider = 'sophtron'
  let selected_weight = 0;
  for(let [provider, value] of Object.entries(weights)){
    if(selected_weight < value.weight){
      selected_weight = value.weight;
      selected_provider = provider
    }
  }
  return {
    provider: selected_provider,
    weight: selected_weight,
    weights,
  };
}

async function loadData(){
  let versions = await axios.get(`${config.DataBaseUrl}version.json`).then(res => res.data);
  let version = versions[config.Env];
  let ret = {version};
  if(db.version === version){
    logger.info(`Data version unchanged: ${version}`)
    return
  }
  logger.info(`loading data, version: ${version}`);
  const response = await axios.get(config.DataBaseUrl + `db/${version}.csv`, {
    responseType: 'stream'
  }).catch(err => {
    if(err?.response?.status === 404){
      return [];
    }
  });
  const stream = response?.data;
  if(!stream){
    return [];
  }
  let arr = (await utils.processCsv(stream));
  if(!arr){
    return [];
  }
  logger.info(`loaded data: ${arr.length}`);

  ret.data = arr.map((row) => row[0]);
  ret.searchIndex = tools.buildIndex(arr);
  let providers = arr[0].pop().replace('foreignKeys(', '').replace(')', '').split(';')
  logger.info(`Building key index, providers: ${providers.join(';')}`);
  ret.keyIndex = arr.reduce((obj, row, index) => {
    if(index === 0){
      return obj;
    }
    let item = {
      id: row[0],
      name: row[1].replace(config.CsvEscape, ','),
      url: row[2],
      logo_url: row[3],
      fks: {}
    }
    let fks = row[4].split(';');
    for(let i = 0; i < providers.length; i++){
      if(fks[i]){
        item.fks[providers[i]] = fks[i]
      }
    }
    // consider returning the only provider entry so resolving is not needed
    // if(Object.keys(item.fks).length === 1){
    //   item.provider = Object.keys()[0];
    //   item.id = Object.values()[0];
    // }
    obj[item.id] = item;
    return obj;
  }, {})
  logger.info(`Initial data loaded and indexed`);
  db = ret;
}
loadData();
setInterval(loadData, config.DataLoadIntervalSeconds * 1000)

async function searchInstitutions(name){
  if(!db.data){
    await loadData();
  }
  let queries = decodeURIComponent(name || '')
    .toLowerCase().split(' ')
    .filter(s => s.trim().length > 1)
    .map(s => s.trim());
  let findings = queries.map((q, i) => (db.searchIndex[q] || []).filter(t => t.order >= i)).filter(a => a.length > 0);
  let matches = findings.length == 1 ? (findings[0] || []).map(item => item.row) : findings.reduce((arr, cur, index) => {
    for(let item of cur){
      if(arr.length > config.MaxSearchResults){
        return arr;
      }
      if(arr.indexOf(item.row) > -1){
        return arr
      }
      if(findings.every((numbers, i) => i === index || numbers.some(t => t.row === item.row ))){
        arr.push(item.row)
      }
    }
    return arr;
  }, [])
  return {
    // queries,
    // findings: `${findings.length}, ${findings.map(a => a.length).join(',')}`,
    // matches,
    institutions: matches.map(m => {
      //let rowNumber = m.substring(1);
      let id = db.data[m];
      let entry = db.keyIndex[id];
      return {
        // index: m,
        name: entry.name,
        id,
        url: entry.url,
        logo_url: entry.logo_url,
        providers: entry.fks
      };
    })//.sort((a,b) => a.name.length - b.name.length)
  }
}
async function getPreference(partner, noDefault){
  if(partner) {
    logger.trace(`Getting preferences for partner: ${partner}`)
    let ret = await s3Client.GetObject(`${s3Prefix}preferences/${partner}/default.json`, true);
    logger.trace(`Preferences for partner: ${partner}:`)
    if(ret){
      return ret
    }else if(noDefault){
      return {}
    }
  }
  return defaultPref || (defaultPref = await http.wget(config.DataBaseUrl + 'preferences/default.json'));
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
      let { id, partner, cache : useCache } = req.query;
      let { to_provider} = req.params;
      let item = db.keyIndex[id];
      let weights;
      let cached = useCache !== 'false';
      if(!item){
        res.sendStatus(404);
      }
      if(!to_provider || to_provider === 'auto'){
        let pref = await getPreference(partner);
        if(!to_provider){
          to_provider = pref.providerMapping[id]?.provider || pref.defaultProvider;
        }else{
          let name = item.name.toLowerCase().replace(/[ \.,()]/g, '_').replace(/_+/g, '_');
          let getFn = () => {
            const url = `${config.SophtronAnalyticsServiceEndpoint}${name}/metrics/job/dummystart/dummyend`;
            logger.trace(`Getting analytics data from ${url}`)
            return axios.get(url).then(res => {
              logger.debug(`Received analytics data from`, res.data)
              return res.data
            }).catch(err => {
              logger.error(`Error getting analytics data from ${url}`, err)
            })
          }
          let key = `${config.Component}/metrics/${name}`
          let metrics = await (cached ? cache.getOrSet(key, getFn) : getFn())
          if(!cached){
            await cache.set(key, metrics)
          }
          let ret = weightByPerformance(metrics, pref)
          to_provider = ret.provider
          weights = ret.weights
        }
      }
      
      if(to_provider && item.fks[to_provider]){
        res.send({
          target_id: item.fks[to_provider],
          provider: to_provider,
          weights,
          cached
        })
      }else{
        for(let p in item.fks){
          if(item.fks[p]){
            res.send({
              target_id: item.fks[p],
              provider: p,
              weights,
              cached
            })
            return;
          }
        }
      }
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