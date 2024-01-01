const s3 = require('../utils/s3')
const config = require('./config')
const logger = require('../infra/logger')
const http = require('../infra/http')

const s3Client = s3({
  region: config.AwsRegion,
  bucket: config.S3Bucket
})

const s3Prefix = `search/${config.Env}/`
let defaultPref;

async function auth(req){
  const user = await http.get(`${config.AuthServiceEndpoint}/api/auth`, {Authorization: req.headers.Authorization})
  return user;
}

async function getPreference(partner, noDefault){
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
}

module.exports = {
  getPreference,
  mapApi(app){
    app.get('/api/preference', async function(req, res){
      let { partner } = req.query;
      let ret = await this.getPreference(partner, true)
      res.send(ret)
    })
    app.put('/api/preference', async function(req, res){
      const user = await auth(req);
      if(user){
        await s3Client.PutObject(`${s3Prefix}preferences/${user.name}/default.json`, JSON.stringify(req.body))
        res.sendStatus(200)
        return;
      }
      res.sendStatus(401)
    })
  }
}