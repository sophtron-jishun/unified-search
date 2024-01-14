const mxClient = require('../mxClient');
const config = require('../../config');
const utils = require('../../../utils')

function filter_logo(item){
  if(item.medium_logo_url !== 'https://content.moneydesktop.com/storage/MD_Assets/Ipad%20Logos/100x100/default_100x100.png'){
    return item.medium_logo_url;
  }
  if(item.small_logo_url !== 'https://content.moneydesktop.com/storage/MD_Assets/Ipad%20Logos/50x50/default_50x50.png'){
    return item.small_logo_url
  }
  return '';
}

const header = 'code,name,url,medium_logo_url';
const row = (item)=>`${item.code},${item.name.trim().replaceAll(',', config.CsvEscape)},${item.url},${filter_logo(item)}`;
mxClient.batchLoadInstitutions('prod').then(all => {
  //console.log(all)
  utils.arrayToCsvFile(all.filter(b => !b.name.toLowerCase().startsWith('finbank')), 'interim/mx', header, row )
});
mxClient.batchLoadInstitutions('int').then(all => {
  //console.log(all)
  utils.arrayToCsvFile(all.filter(b => b.code !== 'amex' && b.code !== 'citibank'), 'interim/mx_int', header, row )
});