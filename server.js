require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { camelizeKeys } = require('humps');
// const Redis = require('ioredis');
const constants = require('./constants');
const { handleAccount } = require('./hook-handler');

const app = express();
const port = process.env.PORT;
// const redis = Redis(process.env.REDIS_URL);

app.use(bodyParser.json());

app.use((request, response, next) => {
  const { body } = request;
  request.body = camelizeKeys(body);
  next();
});

app.get('/webhook', (request, response) => {
  const { challenge } = request.query;
  response.send(challenge);
});

app.post('/webhook', (request, response) => {
  if (!validateRequest(request)) {
    return response.status(403).send('Request is invalid');
  }
  const { body: { listFolder: { accounts } } } = request;
  accounts.forEach(handleAccount);
});

app.listen(port, () => {
  console.log(`app is listening on ${port}`);
});

function validateRequest(request) {
  // TODO
  const { body } = request;
  if (!body || !body.listFolder || !body.listFolder.accounts) {
    return false;
  }
  return true;
}
