const express = require('express');
const Alexa = require('ask-sdk-core');
const { ExpressAdapter } = require('ask-sdk-express-adapter');
const {start} = require('./browse');

const app = express();
const skillBuilder = Alexa.SkillBuilders.custom();
const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, false, false); // set to true, true for cert sig verification and timestamp verification

app.post('/', adapter.getRequestHandlers());
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/test', (req, res) => {
  start();
  res.end();
});

app.listen(3000);