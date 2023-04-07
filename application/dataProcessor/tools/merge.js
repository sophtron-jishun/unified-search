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
const providers = [
  'mx',
  'sophtron'
]
const sourceDataSchema = {
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
const file_names = {
  input: {
    mx_sophtron: utils.resolveDataFileName('input/20230309_mx_institutions_sophtron_g374.csv'),
    sophtron: utils.resolveDataFileName('input/sophtron', '.csv', true),
    mx: utils.resolveDataFileName('input/mx', '.csv', true)
  },
  output: {
    main: utils.resolveDataFileName('output/main', '.csv', true)
  }
}

const db = {
  current: {
    mainIndex: {},
    foreignIndexes: {
      mx: {},
      sophtron: {}
    }
  },
  input: {

  }
}

function logDb(db){
  //logger.info(`mapping: ${db.mapping.length}, sophtron: ${db.sophtron.length}, mx: ${db.mx.length}`)
}

function processProvider(source, mapping, source_provider, mapped_provider, sourceSchema, mappingSchema, name_match){
  logger.info(`Processing provider data: ${source_provider}, ${source.length}`)
  for(let i = 1; i < source.length; i++){
    let s = source[i];
    let sourceId = s[sourceSchema['id']];
    // find the mapping if exists
    let mappedId = mapping.find(item => 
        item[mappingSchema[source_provider]] === sourceId
        || (name_match && item[mappingSchema['name']] === s[sourceSchema['name']])
      )?.[mappingSchema[mapped_provider]];
    let entries = db.current.foreignIndexes[source_provider]?.[sourceId];
    let entry;
    if(mappedId){
      //foreignKey index is not unique, locate the exact mapping and leave other entries alone, 
      // other entries may become invalid (mapped provider removed that entry), use another loop at the end to clean up
      entry = entries?.find(en => !en.foreignKeys[mapped_provider] || en.foreignKeys[mapped_provider] === mappedId)
    }else{
      // if there isn't mapped provider at all, it should be not recorded or only one entry recorded
      entry = entries?.[0];
    }
    let newKey = !entry?.foreignKeys?.[mapped_provider]
    if(!entry){
      // take the current provider used id as the universal Id, first come first serve
      let uid = sourceId;
      entry = db.current.mainIndex[uid] = {
        id: uid,
        foreignKeys: {
          [source_provider]: uid
        }
      }
    }
    if(entry.id === sourceId){
      // entry may get updated, 
      entry.name = s[sourceSchema['name']];
      entry.url = s[sourceSchema['url']];
      entry.logo = s[sourceSchema['logo']];
    }
    // ensure foreign index so that this can be found later 
    if(newKey){
      if(!db.current.foreignIndexes[source_provider]?.[sourceId]){
        db.current.foreignIndexes[source_provider][sourceId] = [];
      }
      db.current.foreignIndexes[source_provider][sourceId].push(entry);
      if(mappedId){
        entry.foreignKeys[mapped_provider] = mappedId;
        if(!db.current.foreignIndexes[mapped_provider]?.[mappedId]){
          db.current.foreignIndexes[mapped_provider][mappedId] = [];
        }
        db.current.foreignIndexes[mapped_provider][mappedId].push(entry);
      }
    }
  }
}

(async function entry(){
  db.input.mx_sophtron = await utils.processCsvFile(file_names.input.mx_sophtron);
  db.input.sophtron = await utils.processCsvFile(file_names.input.sophtron);
  db.input.mx = await utils.processCsvFile(file_names.input.mx);
  logger.info('Input:')
  logDb(db.input);
  let main = await utils.processCsvFile(file_names.output.main);
  db.current.mainIndex = main.reduce((sum, item) => {
    let entry = {};
    for(let i = 0; i < mainIndexSchema.length - 1; i++){
      // make an main index entry
      entry[mainIndexSchema[i]] = item[i];
    }
    let foreignKeys = item[mainIndexSchema.length - 1].split(';');
    entry.foreignKeys = {}
    //loop through provider list and save foreignkeys by provider name if exists
    for(let i = 0; i < providers.length; i++){
      let providerName = providers[i];
      // save foreign key value to entry
      entry.foreignKeys[providerName] = foreignKeys[i];
      if(foreignKeys[i]){
        // index the foreign key for later lookup
        if(!db.current.foreignIndexes[providerName]){
          db.current.foreignIndexes[providerName] = {
            // there could by many to many mappings, the foreignKey index is not unique
            [foreignKeys[i]]:[]
          }
        }
        db.current.foreignIndexes[providerName][foreignKeys[i]].push(obj);
      }
    }
    sum[entry.id] = entry;
    return sum;
  }, {})
  logger.info('Output:')
  logDb(db.output);
  processProvider(db.input.mx, db.input.mx_sophtron, 'mx', 'sophtron', sourceDataSchema, mx_sophtron_schema, true)
  processProvider(db.input.sophtron, db.input.mx_sophtron, 'sophtron', 'mx', sourceDataSchema,mx_sophtron_schema)
  const file_name = utils.resolveDataFileName('output/main', '.csv', false);
    logger.info('Saving to file: ' + file_name)
    var fwriter = fs.createWriteStream(file_name, {
      flags: 'w' // a: append, w: write
    })
    fwriter.write('uid,name,url,logo,foreignKeys(mx;sophtron)')
    for(let key in db.current.mainIndex){
      let item = db.current.mainIndex[key];
      fwriter.write(`\n${key},${item.name.replaceAll(',', config.csvEscape)},${item.url},${item.logo||''},${item.foreignKeys.mx||''};${item.foreignKeys.sophtron||''}`)
    }
})()