const config = require("./config.js");
const express = require("express");
const bodyParser = require("body-parser");
const api = require('./api.js');
const {logger, statsd} = require('sph-base');
const {enablePing, enableDiagnose, enableHealthCheck, mapApi} = require('sph-express-basic');

process.on('unhandledRejection', error => {
  logger.error('unhandledRejection: ' + error.message, error);
});

const app = express();
app.use(statsd.expressStatsd);
app.use(logger.requestHandler);
app.use(logger.errorHandler);
app.use(function (err, req, res, next) {
  if(err){
    logger.err("Unhandled error: ", err);
    res.sendStatus(500)
  }
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

enablePing(app);
enableDiagnose(app, config, []);
enableHealthCheck(app);

mapApi(app, api, logger, '/api/');

app.get('*', logger.skipLog, function (req, res) {
  res.sendStatus(404);
});

app.listen(config.Port, () => {
  var message = `Server is running on port ${config.Port}, env: ${config.Env}`;
  logger.info(message);
});