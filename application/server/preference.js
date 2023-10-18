const s3 = require('../utils/s3')
const config = require('./config')
const logger = require('../infra/logger')

const s3Client = s3({
  region: config.AwsRegion,
  accessKey: config.DataBucketAccessKey,
  accessKeyId: config.DataBucketAccessKeyId,
  bucket: config.S3Bucket
})

const s3Prefix = `${config.Env}/search/`

module.exports = {
  async getPreference(partner, noDefault){
    if(partner) {
      logger.trace(`Getting preferences for partner: ${partner}`)
      let ret = await s3Client.GetObject(`${s3Prefix}preferences/${partner}/default.json`, true);
      logger.trace(`Preferences for partner: ${partner}:`)
      if(ret){
        return ret
      }else if(noDefault){
        return {}
      }
    }
    return defaultPref || (defaultPref = await http.wget(config.DataBaseUrl + 'preferences/default.json'));
  },
  mapApi(app){
    app.get('/api/preference', async function(req, res){
      let { partner } = req.query;
      let ret = await getPreference(partner, true)
      res.send(ret)
    })
    app.put('/api/preference', async function(req, res){
      let { partner } = req.query;
      //TODO authenticate partner
      if(partner){
        await s3Client.PutObject(`${s3Prefix}preferences/${partner}/default.json`, JSON.stringify(req.body))
        res.sendStatus(200)
        return;
      }
      res.sendStatus(400)
    })
  }
}