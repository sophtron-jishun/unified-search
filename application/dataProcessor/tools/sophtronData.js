const sophtronClient = require('../sophtronClient');
const utils = require('../../utils')
const config = require('../../config');

sophtronClient.batchGetInstitutions().then(all => {
  utils.arrayToCsvFile(all, 'input/sophtron','id,name,url,logo_url', (item)=>`${item.InstitutionID},${item.InstitutionName.replaceAll(',', config.CsvEscape)},${item.URL?.trim() || ''},${item.Logo?.trim() ||''}` )
});