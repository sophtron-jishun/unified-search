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
  const user = await http.get(`${config.AuthServiceEndpoint}auth`, {Authorization: req.headers.authorization})
    .catch(err => {
      logger.trace(`Auth failed with header value: ${req.headers.authorization}`, err);
    })
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
  auth,
  mapApi(app){
    app.get('/api/preference', async function(req, res){
      const user = await auth(req);
      if(user?.name){
        let ret = await getPreference(user.name.toLowerCase(), true)
        res.send(ret)
        return;
      }
      res.sendStatus(401)
    })
    app.put('/api/preference', async function(req, res){
      const user = await auth(req);
      if(user?.name){
        await s3Client.PutObject(`${s3Prefix}preferences/${user.name.toLowerCase()}/default.json`, JSON.stringify(req.body))
        res.sendStatus(200)
        return;
      }
      res.sendStatus(401)
    })
  }
}