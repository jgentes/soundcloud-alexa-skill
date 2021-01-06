require('puppeteer-stream');
const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');

// init
let page, wait, stream, file, filename, filepath, browser, cleaning, payload = {};

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

const init = async res => {
  // puppeteer browser params
  browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    ignoreDefaultArgs: ['--mute-audio'],
  });

  browser.on('disconnected', () => {
    page = null;
    cleanup('Browser disconnected');
  });

  // use first tab
  const pages = await browser.pages();
  page = pages[0];

  console.log('creating file for streaming');
  stream = await page.getStream({audio: true});

  ffmpeg(stream)
  .format('mp3')
  .on('error', err => cleanup(`Stream error: ${err.message}`))
  .on('end', () => cleanup('End of stream'))
  .pipe(res, { end: true });

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
  if (!page) await init(res);

  if (firstTrack) {
    await evalPage('clicking Mute', '.volume__button');
    await evalPage('clicking Play', '[title="Play"]');
    await evalPage('clicking Shuffle', '[title="Shuffle"]');
  }

  await evalPage('clicking Skip', '.skipControl__next');

  const artist = await evalPage('getting artist', '.playbackSoundBadge__lightLink', 0, el => el.getAttribute('title'));
  const title = await evalPage('getting track title', '.playbackSoundBadge__titleLink', 0, el => el.getAttribute('title'));
  const href = await evalPage('getting track link', '.playbackSoundBadge__titleLink', 0, el => new URL(el.href).pathname.replaceAll('/','-'));
  const background = await evalPage('getting artwork', '.sc-artwork > span', 0, el => el.style.backgroundImage);
  const image = background?.slice(4, -1).replace(/["']/g, "").replace('t120x120', 't500x500');  

  console.log({artist, title, image, filename, filepath});

  if (firstTrack) await evalPage('unMuting', '.volume__button');

	setTimeout(async () => !cleaning && await cleanup('1 minute timeout'), 1000 * 60);

  console.log('finished');
}

const start = async res => await nextTrack(true, res);

module.exports = {start};