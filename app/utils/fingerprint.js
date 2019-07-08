import { app } from 'electron';
import { __await } from 'tslib';

let Finger;
if (!app.config.fingerprint || app.config.fingerprint == 'afm31')
  Finger = require('fingerprint-afm31');
if (app.config.fingerprint == 'r551') {
  Finger = require('fingerprint-r551');
  width = app.config.fingerprintConfig.width;
  height = app.config.fingerprintConfig.height;
}

if (app.config.fingerprint == 'r303t') {
  Finger = require('fprint-r303t');
}


let processImage = async (timeout) => {
  timeout = parseInt(timeout) || 10000;
  let config = app.config.fingerprintConfig;
  let width = 192;
  let height = 192;
  if (app.config.fingerprint == 'r551') {
    width = config.width;
    height = config.height;
  }
  else if (app.config.fingerprint == 'r303t') {
      width = config.width;
      height = config.height;
  }
  app.log('---> enroll start');
  console.log('---> enroll start');
  try {
    let image = await Finger.getImage(timeout, true, Object.assign({ log: app.log }, config || {}));
    if (!image) throw new Error('No image with finger');

    app.log('---> enroll end');
    let mask;
    if (process.env.NODE_ENV == 'production') {
      mask = await image.constructor.read(process.resourcesPath + '/app.asar.unpacked/dist/images/mask.png');
    } else {
      mask = await image.constructor.read(__dirname + '/../images/mask.png');
    }
    if (app.config.fingerprint == 'r551') {
      app.log('---> resize start\n');
      await image.resize(width, height);
    }
    app.log('---> mask start');
    await image.mask(mask, Math.ceil((width - 192) / 2), Math.ceil((height - 192) / 2));
    app.log('---> crop start');
    await image.crop(Math.ceil((config.width - 192) / 2), Math.ceil((config.height - 192) / 2), 192, 192);
    // app.log('---> crop end' + 'Math.ceil((config.width - 192)/2) and Math.ceil((config.height - 192)/2)= ' + Math.ceil((config.width - 192) / 2) + ' : ' + Math.ceil((config.height - 192) / 2));
    if (config.rotate) {
      app.log('---> rotate start');
    await image.rotate(parseInt(config.rotate));
    }
    let buf = await new Promise((resolve, reject) => image.getBuffer(image.constructor.MIME_PNG, (err, buffer) => err ? reject(err) : resolve(buffer)));

    return buf;
  }
  catch (e) {
    app.log ('--->err fingerprint' + e);
    app.log ('err=',e);
    throw new Error('No image with finger');
  }
}

module.exports = processImage;
