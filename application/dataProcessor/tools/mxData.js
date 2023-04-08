const mxClient = require('../mxClient');
const config = require('../../config');
const utils = require('../../utils')

const header = 'code,name,url,medium_logo_url';
const row = (item)=>`${item.code},${item.name.replaceAll(',', config.CsvEscape)},${item.url},${item.medium_logo_url}`;
mxClient.batchLoadInstitutions('prod').then(all => {
  utils.arrayToCsvFile(all, 'input/mx', header, row )
});
mxClient.batchLoadInstitutions('int').then(all => {
  utils.arrayToCsvFile(all, 'input/mx_int', header, row )
});