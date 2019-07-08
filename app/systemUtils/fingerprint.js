const fs = require('fs');

const Finger = require('fingerprint-afm31');

const savePath = process.argv[2] || './fingers';
const timeout = parseInt(process.argv[3]) || 10000;

const filename = '/finger.png';

if (!fs.existsSync(savePath)) {
  fs.mkdir(savePath, '0777');
}

let resPath = (savePath + filename).replace('//', '/');

let processImage = async () => {
  let image = await Finger.getImage(timeout, true);
  if (!image) throw new Error('No image with finger');

  let mask = await image.constructor.read(__dirname + '/../images/mask.png');

  await image.mask(mask, 0, 0).write(resPath);
  console.log(resPath);
}

processImage();
