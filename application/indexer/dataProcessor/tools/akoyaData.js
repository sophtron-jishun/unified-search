const config = require('../../config');
const utils = require('../../../utils')
const {distance, closest} = require('../../../utils/fastest-levenshtein');
const readline = require('node:readline/promises');
const match = require('./fiNameMatch')

process.on('SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
  // some other closing procedures go here
  process.exit(0);
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function parseAkoyaInstitutions(){
  const whitelistFile = utils.resolveDataFileName('raw/akoya_sophtron_whitelist', '.csv', true)
  const blacklistFile = utils.resolveDataFileName('raw/akoya_sophtron_blacklist', '.csv', true)
  const sophtronFile = utils.resolveDataFileName('input/sophtron_20230604.csv')
  const akoyaFile = utils.resolveDataFileName('raw/akoya_20240108.csv')
  const sophtron = await utils.processCsvFile(sophtronFile);
  const akoya = await utils.processCsvFile(akoyaFile);
  const whitelist = await utils.processCsvFile(whitelistFile);
  const blacklist = await utils.processCsvFile(blacklistFile);
  sophtron.shift()
  akoya.shift()
  whitelist.shift()
  blacklist.shift()
  utils.arrayToCsvFile(akoya, 'interim/akoya','id,name,url,logo_url', (item)=>`${item[1]},${item[0]},,` )
  const map = [];
  let exact = 0;
  let unmatched = [];
  for(const line of akoya){
    const id = line[1];
    const name = line[0];
    let white = whitelist.find(item => item[0] === name);
    if(white){
      map.push({
        name,
        akoya: id,
        sophtron: white[2],
        comment: white[1]
      })
      continue;
    }
    console.log(`matching line ${line}`)
    const diss = [];
    let black = blacklist.filter(item => item[0] === name);
    for(const s of sophtron){
      if(black.find(b => b[1] === s[1])){
        continue;
      }
      const dup = diss.find(item => item.sophtron === s[1])
      if(dup){
        dup.dup++;
        continue;
      }
      const aname = name.replace('Bank of', '').replace('Bank', '').replaceAll('  ', ' ');
      const sname = s[1].replace('Bank of', '').replace('Bank', '').replaceAll('  ', ' ');
      if(match(name, s[1])){
        map.push({
          name,
          akoya: id,
          sophtron: s[0],
          comment: name === s[1] ? '' : s[1]
        })
        diss.length = 0;
        break;
      }
      const d = distance(aname, sname);
      if(d < 5){
        diss.push({
          d,
          akoya: name,
          sophtron: s[1],
          sophtron_id: s[0],
          dup: 0
        })
      }
    }
    //console.log(`Found close ones:`, diss)
    if(false && diss.length > 0){
      const q = `Please select the following name: use the index as answer, "n" for none:\n
        ${diss.sort((a,b)=> a.d - b.d).map((di, i) => `${i}: ${di.akoya} --${di.d}--> ${di.sophtron}`).join('\n        ')}
        `;

      async function manualMatch(query){
        const a = await rl.question(query);
        console.log(`The answer is ${a}`)
        switch(a){
          case 'n':
            for(let ds of diss){
              blacklist.push([name, ds.sophtron, ds.d]);
            }
            break;
          case 's':
            break;
          default:
            if(!isNaN(a) && a >= 0 && a < diss.length){
              let picked = diss[parseInt(a)];
              whitelist.push([picked.akoya, picked.sophtron, picked.sophtron_id]);
              map.push({
                name,
                akoya: id,
                sophtron: picked.sophtron_id,
                comment: picked.sophtron
              });
            }else{
              await manualMatch('invalid answer')
            }
        }
      }
      await manualMatch(q);
      utils.arrayToCsvFile(whitelist, 'raw/akoya_sophtron_whitelist','akoya,sophtron,sophtron_id', (item)=>`${item.join(',')}` )
      utils.arrayToCsvFile(blacklist, 'raw/akoya_sophtron_blacklist','akoya,sophtron,distance', (item)=>`${item.join(',')}` )
    }else{
      unmatched.push(line);
    }
  }
  console.log(`Mapped ${map.length} of ${akoya.length} akoya banks, ${exact} exact matched`)
  console.log(`Unmapped ${unmatched.length} of ${akoya.length} akoya banks`)
  utils.arrayToCsvFile(map, 'interim/akoya_sophtron','name,akoya,sophtron,comment', (item)=>`${item.name},${item.akoya},${item.sophtron},${item.comment}` )
}

parseAkoyaInstitutions().then(() => {
  rl.close()
})