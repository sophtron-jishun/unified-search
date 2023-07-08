const utils = require('../../utils');
const config = require('../../config');
const fs = require('fs')
const {logger} = require('sph-base');
const mainIndexSchema = [
  'id',
  'name',
  'url',
  'logo',
  'foreignKeys'
]
const providers = {
  sophtron: utils.resolveDataFileName('input/sophtron', '.csv', true),
  mx: utils.resolveDataFileName('input/mx', '.csv', true),
  akoya: utils.resolveDataFileName('input/akoya', '.csv', true),
  finicity: utils.resolveDataFileName('input/finicity', '.csv', true),
  mx_int: utils.resolveDataFileName('input/mx_int', '.csv', true),
  akoya_sandbox: utils.resolveDataFileName('input/akoya_sandbox', '.csv', true),
  finicity_sandbox: utils.resolveDataFileName('input/finicity_sandbox', '.csv', true),
}
const defaultSourceDataSchema = {
  id: 0,
  name: 1,
  url: 2,
  logo: 3,
}
const mx_sophtron_schema = {
  name: 1,
  mx: 2,
  sophtron: 3,
}
const akoya_sophtron_schema = {
  name: 0,
  akoya: 1,
  sophtron: 2,
}
const finicity_sophtron_schema = {
  name: 2,
  finicity: 0,
  sophtron: 1,
}
const file_names = {
  input: {
    mx_sophtron: utils.resolveDataFileName('input/20230309_mx_institutions_sophtron_g374.csv'),
    akoya_sophtron: utils.resolveDataFileName('input/akoya_sophtron.csv'),
    finicity_sophtron: utils.resolveDataFileName('input/finicity_sophtron_7_6_2023.csv'),
    ...providers
  },
  output: {
    main: utils.resolveDataFileName('output/main', '.csv', true)
  }
}

const db = {
  current: {
    mainIndex: new Map(),
    foreignIndexes: new Map()
  },
  input: {

  }
}
for(let p in providers){
  db.current.foreignIndexes.set(p, new Map());
}

function logDb(db){
  //logger.info(`mapping: ${db.mapping.length}, sophtron: ${db.sophtron.length}, mx: ${db.mx.length}`)
}

function processProvider(source, mapping, source_provider, mapped_provider, sourceSchema, mappingSchema){
  let start = new Date();
  logger.info(`Processing provider data: ${source_provider}, ${source.length}, to ${mapped_provider}`)
  for(let i = 1; i < source.length; i++){
    let s = source[i];
    let sourceId = s[sourceSchema['id']];
    
    // find the mapping if exists
    let mappedId = mapped_provider ? mapping.find(item => 
        item[mappingSchema[source_provider]] === sourceId)?.[mappingSchema[mapped_provider]] : null ;
    let entries = db.current.foreignIndexes.get(source_provider)?.get(sourceId);
    let entry;
    if(!entries && mappedId){
      entries = db.current.foreignIndexes.get(mapped_provider)?.get(mappedId);
      entry = entries?.[0];
    }
    if(mappedId && !entry){
      //foreignKey index is not unique, locate the exact mapping and leave other entries alone, 
      // other entries may become invalid (mapped provider removed that entry), use another loop at the end to clean up
      entry = entries?.find(en => !en.foreignKeys[mapped_provider] || en.foreignKeys[mapped_provider] === mappedId)
    }else{
      // if there isn't mapped provider at all, it should be not recorded or only one entry recorded
      entry = entry || entries?.[0];
    }
    let newKey = !entry?.foreignKeys?.[mapped_provider || 'dummy']
    if(!entry){
      // take the current provider used id as the universal Id, first come first serve
      // if no other providers to map, make the universal id specific
      let uid = mapped_provider ? sourceId: `${source_provider}_${sourceId}`;
      entry = {
        id: uid,
        foreignKeys: {
          [source_provider]: sourceId
        }
      };
      db.current.mainIndex.set(uid, entry)
    }
    if(!entry.name || entry.id === sourceId){
      // entry may get updated, 
      entry.name = s[sourceSchema['name']];
      entry.url = s[sourceSchema['url']];
      entry.logo = s[sourceSchema['logo']] || entry.logo;
    }
    entry.logo = entry.logo || s[sourceSchema['logo']];

    // ensure foreign index so that this can be found later 
    if(newKey){
      if(!db.current.foreignIndexes.get(source_provider).has(sourceId)){
        db.current.foreignIndexes.get(source_provider).set(sourceId, []);
      }
      db.current.foreignIndexes.get(source_provider).get(sourceId).push(entry);
      if(mappedId){
        entry.foreignKeys[mapped_provider] = mappedId;
        if(!db.current.foreignIndexes.get(mapped_provider).has(mappedId)){
          db.current.foreignIndexes.get(mapped_provider).set(mappedId, []);
        }
        db.current.foreignIndexes.get(mapped_provider).get(mappedId).push(entry);
      }
    }
  }
  logger.info(`Processed provider data: ${source_provider} to ${mapped_provider}, took ${(new Date() - start)/1000} seconds`)
}

(async function entry(){
  let start = new Date();
  function elapsedSeconds(){
    return (new Date() - start) / 1000;
  }
  for(let [key, file_name] of Object.entries(file_names.input)){
    db.input[key] = await utils.processCsvFile(file_name);
  }
  logger.info(`${elapsedSeconds()}s: Loaded input. pre-processing mx data`)
  for(let map of db.input.mx_sophtron){
    // mx mapping used internal institution guid that's not accessible from public api, update the mapping first
    let public = db.input.mx.find(item => item[defaultSourceDataSchema.name] === map[mx_sophtron_schema.name])
    if(public){
      map[mx_sophtron_schema.mx] = public[defaultSourceDataSchema.id]
    }
  }
  logger.info(`${elapsedSeconds()}s: Pre-processing finicity data`)
  for(let map of db.input.finicity_sophtron){
    map[finicity_sophtron_schema.sophtron] = map[finicity_sophtron_schema.sophtron].toLowerCase()
  }
  logDb(db.input);
  // Load existing mainIndex from file for deltas, may speed things up? 
  // let main = await utils.processCsvFile(file_names.output.main);
  // db.current.mainIndex = main.reduce((sum, item) => {
  //   let entry = {};
  //   for(let i = 0; i < mainIndexSchema.length - 1; i++){
  //     // make an main index entry
  //     entry[mainIndexSchema[i]] = item[i];
  //   }
  //   let foreignKeys = item[mainIndexSchema.length - 1].split(';');
  //   entry.foreignKeys = {}
  //   //loop through provider list and save foreignkeys by provider name if exists
  //   for(let i = 0; i < providers.length; i++){
  //     let providerName = providers[i];
  //     // save foreign key value to entry
  //     entry.foreignKeys[providerName] = foreignKeys[i];
  //     if(foreignKeys[i]){
  //       // index the foreign key for later lookup
  //       if(!db.current.foreignIndexes.get(providerName).has(foreignKeys[i])){
  //         // there could by many to many mappings, the foreignKey index is not unique
  //         db.current.foreignIndexes.get(providerName).set(foreignKeys[i], [])
  //       }
  //       db.current.foreignIndexes.get(providerName].get(foreignKeys[i]).push(obj);
  //     }
  //   }
  //   sum.set(entry.id, entry);
  //   return sum;
  // }, new Map())
  logger.info(`${elapsedSeconds()}s: Output:`)
  logDb(db.output);
  processProvider(db.input.mx_int, [], 'mx_int', '', defaultSourceDataSchema, {})
  processProvider(db.input.akoya_sandbox, [], 'akoya_sandbox', '', defaultSourceDataSchema, {})
  processProvider(db.input.finicity_sandbox, [], 'finicity_sandbox', '', defaultSourceDataSchema, {})

  processProvider(db.input.mx, db.input.mx_sophtron, 'mx', 'sophtron', defaultSourceDataSchema, mx_sophtron_schema)
  processProvider(db.input.sophtron, db.input.mx_sophtron, 'sophtron', 'mx', defaultSourceDataSchema,mx_sophtron_schema)

  processProvider(db.input.sophtron, db.input.akoya_sophtron, 'sophtron', 'akoya', defaultSourceDataSchema, akoya_sophtron_schema)
  processProvider(db.input.akoya, db.input.akoya_sophtron, 'akoya', 'sophtron', defaultSourceDataSchema, akoya_sophtron_schema)

  processProvider(db.input.sophtron, db.input.finicity_sophtron, 'sophtron', 'finicity', defaultSourceDataSchema, finicity_sophtron_schema)
  processProvider(db.input.finicity, db.input.finicity_sophtron, 'finicity', 'sophtron', defaultSourceDataSchema, finicity_sophtron_schema)
  
  const file_name = utils.resolveDataFileName('output/main', '.csv', false);
  logger.info(`${elapsedSeconds()}s: Saving to file: ${file_name}`)
  var fwriter = fs.createWriteStream(file_name, {
    flags: 'w' // a: append, w: write
  })
  fwriter.write(`uid,name,url,logo,foreignKeys(${Object.keys(providers).join(';')})`)
  for(let [key, item] of db.current.mainIndex){
    if(item.name){
      fwriter.write(`\n${key},${item.name.replaceAll(',', config.csvEscape)},${item.url},${item.logo||''},${Object.keys(providers).map(p => `${item.foreignKeys[p] || ''}`).join(';')}`)
    }else{
      logger.error(`Invalid item`, item)
    }
  }
  logger.info(`${elapsedSeconds()}s: Done`)
})()