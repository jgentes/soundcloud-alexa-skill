const express = require('express');
const Alexa = require('ask-sdk-core');
const { ExpressAdapter } = require('ask-sdk-express-adapter');
const {start} = require('./browse');
const fs = require('fs');
const mediaDir = `${__dirname}/static/tmp`;

const app = express();
const skillBuilder = Alexa.SkillBuilders.custom();
const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, false, false); // set to true, true for cert sig verification and timestamp verification

app.post('/', adapter.getRequestHandlers());
app.get('/', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end(helpText);
});

app.get('/media/*', (req, res) => {
  //res.set('content-type', 'audio/mp3');
  //res.writeHead(200, {'Content-Type': 'audio/mp3', 'accept-ranges': 'bytes'});
  //res.setHeader('Content-Type', 'audio/webm');
  //res.setHeader('Transfer-Encoding', 'chunked');
  //res.sendFile(`${mediaDir}/${req.params[0]}`);
  //const file = fs.createReadStream(`${mediaDir}/${req.params[0]}`);
  //let pipe = file.pipe(res, {end: false});
  console.log('Requesting media', `${req.params[0]}`)

  //var r = new stream.PassThrough().end(file);
/*
  file.on('data', chunk => res.write(chunk));
  file.on('error', () => res.sendStatus(500));
  file.on('end', () => res.end());
*/
  //const file = `${mediaDir}/${req.params[0]}`;
})

// expose media dir
app.use(express.static('static'));

app.get('/test.mp3', async (req, res) => {
  console.log('GET received');
  //res.setHeader('Content-Type', 'audio/webm');
  await start(res);
  //const test = new ffmpeg(payload.filepath).pipe(res, {end: true});

  
  //res.set('content-type', 'audio/mp3');
  
  //const filename = payload?.filename && `${req.protocol}://${req.get("Host")}/media/${payload.filename}`;
  //stream.pipe(res);  
  //res.writeHead(200, {'Content-Type': 'audio/mp3', 'accept-ranges': 'bytes'});
  //res.write(file);
  //file.on('data', chunk => res.write(chunk));
  //file.on('error', () => res.sendStatus(500));
  //file.on('end', () => res.end());

  
  //res.send(`<a href="${filename}">${filename}</>` || 'No payload');
});

app.listen(3000);
console.log('Server running..');