const mxClient = require('../mxClient');
const config = require('../../config');
const utils = require('../../utils')

mxClient.batchLoadInstitutions().then(all => {
  utils.arrayToCsvFile(all, 'input/mx','code,name,url,medium_logo_url', (item)=>`${item.code},${item.name.replaceAll(',', config.CsvEscape)},${item.url},${item.medium_logo_url}` )
});