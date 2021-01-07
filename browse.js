require('puppeteer-stream');
const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');

// init
let page, wait, stream, browser, cleaning;

// pause command
wait = async ms => await page.waitForTimeout(ms);

const cleanup = async reason => {
  if (cleaning) return;
  console.log('starting cleanup');
  if (reason) console.error('Reason: ', reason);

  cleaning = true;
  page && stream && await stream.destroy();
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
    cleanup(`${msg} failed: ${e.message}`);
  }
}

const init = async () => {
  // puppeteer browser params
  browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    ignoreDefaultArgs: ['--mute-audio'],
  });

  browser.on('disconnected', () => {
    page = null;
    cleanup('Browser disconnected');
  });

  page = await browser.newPage();
};

// logic for changing tracks and creating file for Alexa to stream
const nextTrack = async (firstTrack, res) => {
  if (!page) await init();  

  console.log('Creating audio stream');
  stream = await page.getStream({audio: true});

  ffmpeg(stream)
  .format('hls')
  .audioQuality(128)
  .on('error', err => cleanup(`Stream error: ${err.message}`))
  .on('end', () => cleanup('End of stream'))
  .pipe(res, { end: true });

  console.log('Waiting for page load..');
  try {
    await page.goto('https://soundcloud.com/jgentes/likes', {waitUntil: 'networkidle2'});
  } catch (e) {
    console.log('Failed to get page!');
  }

  if (firstTrack) {
    await evalPage('Clicking Mute', '.volume__button', 0);
    await evalPage('Clicking Play', '[title="Play"]', 0);
    await evalPage('Clicking Shuffle', '[title="Shuffle"]', 0);
    await evalPage('Disabling Autoplay', '.queueFallback__toggle > label');
  }

  await evalPage('Clicking Skip', '.skipControl__next', 0);

  const artist = await evalPage('getting artist', '.playbackSoundBadge__lightLink', 0, el => el.getAttribute('title'));
  const title = await evalPage('getting track title', '.playbackSoundBadge__titleLink', 0, el => el.getAttribute('title'));
  const background = await evalPage('getting artwork', '.sc-artwork > span', 0, el => el.style.backgroundImage);
  const image = background?.slice(4, -1).replace(/["']/g, "").replace('t120x120', 't500x500');  

  console.log({artist, title, image});

  if (firstTrack) await evalPage('unMuting', '.volume__button');

	//setTimeout(async () => !cleaning && await cleanup('1 minute timeout'), 1000 * 60);

  console.log('Finished');
}

const start = async res => await nextTrack(true, res);

module.exports = {init, start};