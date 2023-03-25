const readline = require('readline')

async function processCsv(inputStream) {
  const ret = [];

  const rl = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity
  });
  let i = 0;
  for await (const line of rl) {
    let arr = line.split(',')
    ret.push(arr)
    if(i > 10){
      //break;
    }
    i++;
  }
  return ret;
}

module.exports = {
  processCsv
}