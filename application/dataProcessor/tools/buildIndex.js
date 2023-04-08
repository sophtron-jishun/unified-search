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
  let words = contentToWords(content.toLowerCase());
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

function buildIndex(mainInput){
  const mainIndex = {};
  logger.info(`Building index, Loaded main input: ${mainInput.length}`)
  for(let i = 1; i< mainInput.length; i++){
    let name = mainInput[i][1];
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
module.exports = {
  buildIndex
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