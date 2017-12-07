require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { camelizeKeys } = require('humps');
const git = require('./git-main');
const { handleAccount } = require('./hook-handler');

const app = express();
const port = process.env.PORT;

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
  console.log('handling accounts');
  accounts.forEach(handleAccount);
  console.info('handled accounts');
  return response.send({ message: 'ok' });
});

app.listen(port, async () => {
  console.log(`app is listening on ${port}`);
  await git.init();
  console.log('git state', git.repo.state);
});

function validateRequest(request) {
  // TODO
  const { body } = request;
  if (!body || !body.listFolder || !body.listFolder.accounts) {
    return false;
  }
  return true;
}
