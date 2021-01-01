require('puppeteer-stream');
const puppeteer = require('puppeteer');
const fs = require('fs');
const mediaDir = `${__dirname}/static/tmp`
const ffmpeg = require('fluent-ffmpeg');

// init
let page, wait, stream, file, filename, browser, cleaning, payload = {};

// pause command
wait = async ms => await page.waitForTimeout(ms);

const cleanup = async () => {
  if (cleaning) return;
  console.log('starting cleanup');

  cleaning = true;
  page && stream && await stream.destroy();
  file && file.close();
  //filename && fs.unlink(`${mediaDir}/${filename}`, () => console.log("audio file deleted"));
  page && browser && await browser.close();
}

// eval command w/ catch block (defaults to click w/ 1s wait afterwards)
evalPage = async (msg, selector, waitMs, elFn) => {
  if (cleaning) return;
  
  console.log(msg);

  try {    
    const val = await page.$eval(selector, elFn || (el => el.click()));
    await wait(waitMs ?? 1000);
    return val;
  } catch (e) {
    console.error(`${msg} failed: ${e.message}`);
    cleanup();
  }
}

const init = async () => {
  // puppeteer browser params
  browser = await puppeteer.launch({
    ignoreDefaultArgs: ['--mute-audio'],
  });

  browser.on('disconnected', () => {
    console.error('Browser disconnected');
    page = null;
    cleanup();
  });

  // use first tab
  const pages = await browser.pages();
  page = pages[0];

  // wait for the page to load (4s?)
  console.log('waiting for page load (4s)');
  try {
    await page.goto('https://soundcloud.com/jgentes');
    await wait(4000);
  } catch (e) {
    console.log('Failed to get page!');
  }
};

// logic for changing tracks and creating file for Alexa to stream
const nextTrack = async (firstTrack, res) => {
  if (!page) await init();

  if (firstTrack) {
    await evalPage('clicking Mute', '.volume__button');
    await evalPage('clicking Play', '[title="Play"]');
    await evalPage('clicking Shuffle', '[title="Shuffle"]');
  }

  await evalPage('clicking Skip', '.skipControl__next');

  if (firstTrack) await evalPage('unMuting', '.volume__button');

  const artist = await evalPage('getting artist', '.playbackSoundBadge__lightLink', 0, el => el.getAttribute('title'));
  const title = await evalPage('getting track title', '.playbackSoundBadge__titleLink', 0, el => el.getAttribute('title'));
  const href = await evalPage('getting track link', '.playbackSoundBadge__titleLink', 0, el => new URL(el.href).pathname.replaceAll('/','-'));
  const background = await evalPage('getting artwork', '.sc-artwork > span', 0, el => el.style.backgroundImage);
  const image = background?.slice(4, -1).replace(/["']/g, "").replace('t120x120', 't500x500');  

  if (!cleaning) {
    console.log('creating file for streaming');
    stream = await page.getStream({audio: true});
   
    filename = `${href}.webm`;
    const filepath = `${mediaDir}/${filename}`;
    
    file = fs.createWriteStream(filepath);
    stream.pipe(file);
    payload = {artist, title, image, filename, filepath};
    console.log(payload);
    
    ffmpeg(stream)
    .format('mp3')
    .on('error', function(err) {
    console.log('An error occurred: ' + err.message); // NEED TO SHUTDOWN THE BROWSER IF THIS HAPPENS
    })
    .pipe(res, { end: true });
  }

  

	setTimeout(async () => !cleaning && await cleanup(), 1000 * 60);

  console.log('finished');
  return payload;
}

const start = async res => await nextTrack(true, res);

module.exports = {start};