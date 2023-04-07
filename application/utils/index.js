const fs = require('fs');
const path = require('path');
const readline = require('readline');
const config = require('../config');
const { logger } = require('sph-base');

async function processCsv(inputStream) {
  const rl = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity
  });
  const ret = [];
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.
  for await (const line of rl) {
    let arr = line.split(',');
    let i = 0;
    while(i > 0 && arr.length > ret[0].length - 1){
      // if a line has more columns than header row, there are escaped ',' splitted with, merge them back
      // if (arr[0] == '647') {
      //   logger.info(ret[0])
      //   logger.info(arr)
      // }
      for(let j = 0; j < arr.length; j++){
        if(column.startsWith('"')){
          while(j < arr.length){
            arr[j] = arr[j] + config.CsvEscape + arr[j+1]; //choose a new delimiter that's not used in the doc
            arr.splice(j, 1);
            if(arr[j].endsWith('"')){
              break;
            }
          }
          arr[j] = arr[j].replaceAll('"', '');
        }
      }
    }
    // if(arr[0] == '647'){
    //   logger.info(ret[0])
    //   logger.info(arr)
    // }
    ret.push(arr);
    // if(i > 10){
    //   //break;
    // }
    i++;
  }
  return ret;
}

async function processCsvFile(file_name){
  logger.info(`Loading csv from: ${file_name}`)
  if(fs.existsSync(file_name)){
    const fileStream = fs.createReadStream(file_name);
    return processCsv(fileStream)
  }
  logger.info(`File not exist: ${file_name}`)
  return []
}

function resolveDataFileName(file_name, extension, use_suffix){
  return path.resolve(path.join(__dirname, '..', 'dataProcessor', 'raw_data', file_name + (use_suffix ? config.DataSuffix : '') + (extension || '')))
}

function arrayToCsv(arr, streamWriter, header_str, line_str_func){
  streamWriter.write(header_str) 
  for (const item of arr){
    streamWriter.write(`\n${line_str_func(item)}`) 
  }
}

function arrayToCsvFile(arr, data_file_name, header_str, line_str_func){
  if(data_file_name){
    const file_name = resolveDataFileName(data_file_name, '.csv', true);
    logger.info('Saving to file: ' + file_name)
    var fwriter = fs.createWriteStream(file_name, {
      flags: 'w' // a: append, w: write
    })
    arrayToCsv(arr, fwriter, header_str, line_str_func)
  }
}

module.exports = {
  resolveDataFileName,
  processCsv,
  processCsvFile,
  arrayToCsv,
  arrayToCsvFile,
}