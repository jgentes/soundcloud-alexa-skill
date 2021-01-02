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

const helpText = `
<!DOCTYPE html>
<html>
<head>
<title>Your NodeJS Droplet</title>
<style>
    body {
        width: 55em;
        margin: 0 auto;
        font-family: Tahoma, Verdana, Arial, sans-serif;
        background: #AAAAAA;
    }
    div {
      padding: 30px;
      background: #FFFFFF;
      margin: 30px;
      border-radius: 5px;
      border: 1px solid #888888;
    }
    code {
      font-size: 16px;
      background: #DDDDDD;
    }
</style>
</head>
<body>
  <div>
    <h1>Sammy welcomes you to your Droplet!</h1>
    <img src="/assets/sammytheshark.gif" />
    <h2>Things to do with this script</h2>
    <p>This message is coming to you via a simple NodeJS application that's live on your Droplet! This droplet is all set up with NodeJS, PM2 for process management, and nginx.</p>
    <p>Run all pm2 commands using the nodejs user or a second instance of pm2 will start. The login and password are stored in the <code>NODE_USER*</code> values you see when you call  <code>cat /root/.digitalocean_passwords</code> while logged in over SSH.</p>
    <p>This app is running at port 3000, and is being served to you by nginx, which has mapped port 3000 to be served as the root URI over HTTP (port 80) -- a technique known as a "reverse proxy." We'll be teaching you how to use this technique right here on this page. If you want to kick the tires right now, try some of these things:</p>
    <ul>
      <li>SSH into your Droplet and modify this script at <code>/var/www/html/hello.js</code> and see the results live by calling <code>pm2 restart hello</code></li>
      <li>Run <code>pm2 list</code> to see code scheduled to start at boot time</li>
      <li>Run <code>pm2 delete hello</code> to stop running this script and <code>pm2 save</code> to stop it from running on Droplet boot</li>
    </ul>
    <h2>Get your code on here</h2>
    <ul>
      <li>SSH into your Droplet, and <code>git clone</code> your NodeJS code onto the droplet, anywhere you like</li>
      <ul>
        <li>Note: If you're not using a source control, you can <a href="https://www.digitalocean.com/docs/droplets/how-to/transfer-files/">directly upload the files to your droplet using SFTP</a>.
      </ul>
      <li><code>cd</code> into the directory where your NodeJS code lives, and install any dependencies. For example, if you have a <code>package.json</code> file, run <code>npm install</code>.
      <li>Launch your app by calling <code>pm2 start &lt;your-file&gt;</code>, then map the port your app runs on to an HTTP URL by running <code>nano /etc/nginx/sites-available/default</code> and adding another <code>location</code>. Use the existing entry for the port 3000 "hello" app as a basis.</li>
      <li>Call <code>sudo systemctl restart nginx</code> to enable your new nginx config.</li>
      <li>Call <code>pm2 save</code> to schedule your code to run at launch.</li>
      <li>Repeat these steps for any other NodeJS apps that need to run concurrently -- schedule them to run at boot time on whatever internal port you like using PM2, then map that port to an HTTP/HTTPS URL in the nginx config. Build out the URL directory structure you need by mapping applications to URL paths; that's the reverse proxy method in a nutshell!</code>
    </ul>
    <h2>Get production-ready</h2>
    <p>There's a lot you'll want to do to make sure you're production-ready.</p>
    <ul>
      <li><a href="https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-18-04">Set up a non-root user for day-to-day use</a></li>
      <li>Review your firewall settings by calling <code>sudo ufw status</code>, and make any changes you need. By default, only SSH/SFTP (port 22), HTTP (port 80), and HTTPS (port 443) are open. You can also disable this firewall by calling <code>sudo ufw disable</code> and <a href="https://www.digitalocean.com/docs/networking/firewalls/">use a DigitalOcean cloud firewall</a> instead, if you like (they're free).</li>
      <li><a href="https://www.digitalocean.com/docs/networking/dns/quickstart/">Register a custom domain</a></li>
      <li>Have data needs? You can mount a <a href="https://www.digitalocean.com/docs/volumes/">volume</a> (up to 16TB)
        to this server to expand the filesyem, provision a <a href="https://www.digitalocean.com/docs/databases/">database cluster</a> (that runs MySQL, Redis, or PostgreSQL),
        or use a <a href="https://www.digitalocean.com/docs/spaces/">Space</a>, which is an S3-compatible bucket for storing objects.
    </ul>
  </div>
</body>
</html>
`

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