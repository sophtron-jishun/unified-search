const {logger} = require('sph-base');

const MinTermSize = 2;

function contentToWords(content)
{
  if(content.indexOf('gfgsfsghf')>=0
    || content.startsWith('http')){
    return []
  }
  let words = content.split(' ').filter(w => w.trim()).slice(0, 10)
  //return words.map(w => w.trim().replace(/[^a-zA-Z0-9\&\'\(\)]/g, ''));
  return words.map(w => w.trim().replace(/[^a-zA-Z0-9\&\']/g, ''));
}

function extractTerms(content)
{
  let words = contentToWords(content);
  let terms = {};
  for (let i = 0; i < words.length; i++){
    let word = words[i];
    for(let size = MinTermSize; size <= word.length; size++){
      for (let pos = 0; pos + size <= word.length; pos++)
      {
        let t = word.substring(pos, pos + size);
        terms[t] = { 
          order : (terms[t]?.order < i ? terms[t].order : i),
          wordLength : word.length,
        };
      }
    }
  }
  return terms;
}

let betterNameSuffixes = [
  'bank',
  ' bank',
  ' credit union',
  ' cu',
  ' fcu',
  ' investments',
]

function buildIndex(mainInput){
  const mainIndex = {};
  const nameIndex = mainInput.reduce((obj, cur) => {
    obj[cur[1].toLowerCase()] = [...(obj[cur[1].toLowerCase()] || []) ,cur];
    return obj
  }, {})
  logger.info(`Building index, Loaded main input: ${mainInput.length}`)
  for(let i = 1; i< mainInput.length; i++){
    let entry = mainInput[i];
    let name = entry[1].toLowerCase();
    let skip = false;
    if(!entry[3]) { // no logo
      if(betterNameSuffixes.some(bns => nameIndex[name + bns]?.some(item => !!item?.[3]))){
        skip = true;
        continue;
      }
    }
    if(nameIndex[name].length > 1){
      for(let dup of nameIndex[name]){
        if(dup[0] !== entry[0]){
          let arr =  dup[4].split(';');
          if(entry[4].split(';').every((provider, index) => !provider || arr[index])){
            skip = true;
            break;
          }
        }
      }
    }
    if(skip){
      continue;
    }
    let terms = extractTerms(name);

    for(let t in terms){
      if(!mainIndex[t]){
        mainIndex[t] = []
      }
      mainIndex[t].push({
        order: terms[t].order,
        row: i,
        wordLength: terms[t].wordLength,
        totalLength: name.length
      });
    }
  }
  logger.info(`Built search index, sorting`)
  for(let t in mainIndex){
    mainIndex[t] = mainIndex[t].sort((a,b) => a.totalLength - b.totalLength || a.wordLength - b.wordLength || a.order - b.order);
  }
  logger.info(`Built search index, done sorting`)
  return mainIndex;
}

function serializeIndexRow(obj){
  return `${obj.order};${obj.row};${obj.wordLength};${obj.totalLength}`
}

function serializeIndex(mainIndex){
  let ret = [];
  for(let key in mainIndex){
    ret.push(`${key}:${mainIndex[key].map(serializeIndexRow).join(',')}`)
  }
  return ret;
}

function deserializeIndexRow(str, aggregator){
  let arr0 = str.split(':') 
  aggregator[arr0[0]] = arr0[1].split(',').map(item => {
      let arr2 = item.split(';');
      return {
        order: parseInt(arr2[0]),
        row: parseInt(arr2[1]),
        wordLength: parseInt(arr2[2]),
        totalLength: parseInt(arr2[3]),
      }
    })
}

module.exports = {
  buildIndex,
  serializeIndex,
  deserializeIndexRow
}

// const utils = require('../../utils');
// const fs = require('fs')
// const mainInput = utils.resolveDataFileName('output/main', '.csv', false);
// const indexOutput = utils.resolveDataFileName('output/index', '.txt', false);
// let ret = (async function entry(){
//   const main = await utils.processCsvFile(mainInput);
//   let mainIndex = buildIndex(main)
//   logger.info(`Writing output: ${indexOutput}`)
//   var fwriter = fs.createWriteStream(indexOutput, {
//     flags: 'w' // a: append, w: write
//   })
//   for(let key in mainIndex){
//     fwriter.write(`\n${key}:${mainIndex[key].join(',')}`)
//   }
// })()