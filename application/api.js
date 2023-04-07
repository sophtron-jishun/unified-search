const {logger, statsd, http} = require('sph-base');
const config = require('./config')
const s3 = require('sph-s3');
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

const db = {
}

async function loadData(){
  logger.info(`loading data`);
  const response = await axios.get(config.DataBaseUrl + 'main.csv', {
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

  db.data = arr.map((row) => row[0]);
  db.searchIndex = tools.buildIndex(arr);
  let providers = arr[0].pop().replace('foreignKeys(', '').replace(')', '').split(';')
  logger.info(`Building key index, providers: ${providers.join(';')}`);
  db.keyIndex = arr.reduce((obj, row, index) => {
    // console.log(`${index} of ${arr.length}`)
    if(index === 0){
      return obj;
    }
    // if(index % 100 == 0){
    //   console.log(`${index} of ${arr.length}`)
    // }
    let item = {
      id: row[0],
      name: row[1].replace(config.CsvEscape, ','),
      url: row[2],
      logo_url: row[3],
      fks: {}
    }
    let fks = row[4].split(';');
    for(let i = 0; i < providers.length; i++){
      item.fks[providers[i]] = fks[i]
    }
    // console.log(item)
    obj[item.id] = item;
    // console.log(obj)
    return obj;
  }, {})
  logger.info(`Initial data loaded and indexed`);
}
loadData();
async function searchInstitutions(name){
  if(!db.data){
    await loadData();
  }
  let queries = decodeURIComponent(name || '').toLowerCase().split(' ').filter(s => s.length > 1);
  let findings = queries.map(q => db.searchIndex[q] || []);
  let matches = findings.length == 1 ? (findings[0] || []) : findings.reduce((arr, cur, index) => {
    for(let rowNumber of cur){
      if(arr.length > config.MaxSearchResults){
        return arr;
      }
      if(arr.indexOf(rowNumber) > -1){
        return arr
      }
      if(findings.every((numbers, i) => i === index || numbers.indexOf(rowNumber) > -1)){
        arr.push(rowNumber)
      }
    }
    return arr;
  }, [])
  return {
    // queries,
    // findings,
    // matches,
    institutions: matches.map(m => {
      let id = db.data[m];
      let entry = db.keyIndex[id];
      return {
        // index: m,
        id,
        name: entry.name,
        url: entry.url,
        logo_url: entry.logo_url,
        providers: entry.fks
      };
    })
  }
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
      let item = db.keyIndex[id];
      if(!item){
        res.sendStatus(404);
      }
      if(!to_provider || to_provider === 'auto'){
        let pref = await getPreference(partner);
        to_provider = pref.providerMapping[id]?.provider || pref.defaultProvider;
      }
      if(to_provider && item.fks[to_provider]){
        res.send({
          target_id: item.fks[to_provider],
          provider: to_provider
        })
      }else{
        for(let p in item.fks){
          if(item.fks[p]){
            res.send({
              target_id: item.fks[p],
              provider: p
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