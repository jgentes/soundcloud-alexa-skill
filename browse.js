require('puppeteer-stream');
const puppeteer = require('puppeteer');
const fs = require('fs');

// init
let page, wait;

const init = async () => {
  // puppeteer browser params
  const browser = await puppeteer.launch({    
    devtools: false,
    ignoreDefaultArgs: ['--mute-audio'],
  });

  // open a new chromium window
  page = await browser.newPage();

  // pause command
  wait = async ms => await page.waitForTimeout(ms);

  // wait for the page to load (4s?)
  console.log('waiting for page load (4s)');
  await page.goto('https://soundcloud.com/jgentes');
  await wait(4000);
};

// logic for changing tracks and creating file for Alexa to stream
const nextTrack = async start => {
  if (!page) await init();

  if (start) {
    console.log('clicking Mute');
    await page.$eval('.volume__button', el => el.click());
    await wait(1000);

    console.log('clicking Play');
    await page.$eval('[title="Play"]', el => el.click());
    await wait(500);

    console.log('clicking Shuffle');
    await page.$eval('[title="Shuffle"]', el => el.click());
    await wait(500);
  }

  console.log('clicking Skip');
  await page.$eval('.skipControl__next', el => el.click());
  await wait(1000);

  if (start) {
    console.log('unMuting');
    await page.$eval('.volume__button', el => el.click());
  }

  console.log('getting track info');
  const artist = await page.$eval('.playbackSoundBadge__lightLink', el => el.getAttribute('title'));
  const title = await page.$eval('.playbackSoundBadge__titleLink', el => el.getAttribute('title'));
  const background = await page.$eval('.sc-artwork > span', el => el.style.backgroundImage);
  const image = background?.slice(4, -1).replace(/["']/g, "").replace('t120x120', 't500x500');
  
  console.log('creating file for streaming');
  const stream = await page.getStream({audio: true});
  const href = await page.$eval('.playbackSoundBadge__titleLink', el => new URL(el.href).pathname.replaceAll('/','-'));
  const filename = `${__dirname}/${href}.webm`;
  const file = fs.createWriteStream(filename);
  
  console.log({artist, title, image, filename})
  stream.pipe(file);
  
	setTimeout(async () => {
		await stream.destroy();
		file.close();		
    fs.unlink(filename, () => console.log("finished"));
	}, 1000 * 10);

  console.log('complete')
}

nextTrack(true);

//await browser.close();