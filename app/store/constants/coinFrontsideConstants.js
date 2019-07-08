import electron from 'electron';
const app = electron.remote.app;

import { getCircularText } from '../../utils/imageFile';

const fs = require('fs');
const gm = require('gm').subClass({imageMagick: true});

const rootFolder = app.imagesPath;

let coins = [];
try {
  coins = JSON.parse(fs.readFileSync(`${rootFolder}/images/Coin/index.json`));
} catch (e) {
  console.error(e);
}

const fillCoinBackgroundText = (coin, side, size) => {
  let style;
  let config = {};

  config.frontsideImageWidth = app.config && app.config.frontsideImageWidth || 1050;
  config.frontsideImageHeight = app.config && app.config.frontsideImageHeight || 1050;

  config.coinStyleClient = app.config && app.config.coinStyleClient || {
		fontFamily: "Montserrat",
		fontSize: "80px",
		fontWeight: 700,
		kerning: -5,
		color: "black"
	};
	
	config.coinStyleImage = app.config && app.config.coinStyleImage || {
		fontFamily: "Montserrat",
		fontSize: "80px",
		fontWeight: 800,
		kerning: -5,
		color: "black"
	};

  config.coinTextImageUp = app.config && app.config.coinTextImageUp || "{city} • {country}";
  config.coinTextImageDown = app.config && app.config.coinTextImageDown || "{day}.{month}.{year}";
  config.coinTextClientUp = app.config && app.config.coinTextClientUp || "CHECK•IN•COIN";
  config.coinTextClientDown = app.config && app.config.coinTextClientDown || "{name}";

  let width = size || config.frontsideImageWidth;
  let height = size || config.frontsideImageHeight;
  let padding = width * 0.025;

  let upText = '';
  let downText = '';
  if (side === 'client') {
    style = config.coinStyleClient;
    upText = config.coinTextClientUp;
    downText = config.coinTextClientDown;
  } else {
    style = config.coinStyleImage;
    upText = config.coinTextImageUp;
    downText = config.coinTextImageDown;
  }

  let day = (new Date()).getDate();
  day = day < 10 ? `0${day}` : day;
  let month = (new Date()).getMonth() + 1;
  month = month < 10 ? `0${month}` : month;
  let year = (new Date()).getFullYear();
  
  upText = upText
    .replace('{city}', coin.city)
    .replace('{country}', coin.country)
    .replace('{name}', coin.name)
    .replace('{day}', day)
    .replace('{month}', month)
    .replace('{year}', year)
    .toUpperCase();
  downText = downText
    .replace('{city}', coin.city)
    .replace('{country}', coin.counry)
    .replace('{name}', coin.name)
    .replace('{day}', day)
    .replace('{month}', month)
    .replace('{year}', year)
    .toUpperCase();

  let circleUpText = getCircularText(upText, width - padding * 2, 0, 'center', true, true, style);
  let circleDownText = getCircularText(downText, width - padding * 2, 180, 'center', true, false, style);

  let circleText = document.createElement('canvas');
  circleText.width = width;
  circleText.height = height;

  let ctContext = circleText.getContext('2d');
  ctContext.drawImage(circleUpText, padding, padding);
  ctContext.drawImage(circleDownText, padding, padding);

  return circleText;
};

export const reRenderCoins = () => {
  let config = {};

  config.frontsideImageWidth = app.config && app.config.frontsideImageWidth || 1050;
  config.frontsideImageHeight = app.config && app.config.frontsideImageHeight || 1050;

  config.coinTextImageUp = app.config && app.config.coinTextImageUp || "{city} • {country}";
  config.coinTextImageDown = app.config && app.config.coinTextImageDown || "{day}.{month}.{year}";
  config.coinTextClientUp = app.config && app.config.coinTextClientUp || "CHECK•IN•COIN";
  config.coinTextClientDown = app.config && app.config.coinTextClientDown || "{name}";

  if (config.imageСolorСorrection) {
    let red = app.config.imageСolorСorrection.red;
    let blue = app.config.imageСolorСorrection.blue;
    let gren = app.config.imageСolorСorrection.gren;
    console.log("<---->", app.config.imageСolorСorrection);
    console.log("<---->red=", red, " gren=", gren, " blue=", blue);
  }
  coins.map(coin => {
    coin.path = `${rootFolder}/images/Coin/${coin.filename}`;
    console.log('<--->coin.path=',coin.path);
    let image = fs.readFileSync(coin.path);
    coin.image = image;
    coin.smallImage = `data:image/png;base64,${image.toString('base64')}`;

    gm(image, coin.filename)
      .resize(190, 190)
      .toBuffer('PNG', (err, buffer) => {
        coin.smallImage = `data:image/png;base64,${buffer.toString('base64')}`;

        coin.clientImage = fillCoinBackgroundText(coin, 'client').toDataURL();
        coin.maskImageText = fillCoinBackgroundText(coin, 'image', config.frontsideImageWidth);

        let imageWithText = document.createElement('canvas');
        imageWithText.width = config.frontsideImageWidth;
        imageWithText.height = config.frontsideImageWidth;
        let ctx = imageWithText.getContext('2d');

        let im1 = new Image();
        im1.src = coin.smallImage;
        im1.width = config.frontsideImageWidth;
        im1.height = config.frontsideImageWidth;

        im1.onload = () => {
          ctx.drawImage(coin.maskImageText, 0, 0);
          ctx.globalCompositeOperation = 'source-out';
          ctx.drawImage(im1, 0, 0, config.frontsideImageWidth, config.frontsideImageHeight);
 
          if (config.imageСolorСorrection) {
            let pixselRead = ctx.getImageData(0, 0, config.frontsideImageWidth, config.frontsideImageHeight);
            var pixelsArray = pixselRead.data;
            for (let y = 0; y < pixselRead.height; y++)
              for (let x = 0; x < pixselRead.width; x++) {
                let pos = ((y * pixselRead.height) + x) * 4;
                // pixelsArray[pos] = 0; //red
                // pixelsArray[pos + 1] = 0; //gren
                // pixelsArray[pos + 2] = 255; //blue
                pixelsArray[pos] = (pixelsArray[pos] * red) > 255 ? 255 : pixelsArray[pos] * red;
                pixelsArray[pos + 1] = (pixelsArray[pos + 1] * gren) > 255 ? 255 : pixelsArray[pos + 1] * gren;
                pixelsArray[pos + 2] = (pixelsArray[pos + 2] * blue) > 255 ? 255 : pixelsArray[pos + 2] * blue;
              }
            ctx.putImageData(pixselRead, 0, 0);
          }
          coin.imageWithTextBase64 = imageWithText.toDataURL();
        }
      });

  });
}

setTimeout(reRenderCoins(), 1000);
setTimeout(reRenderCoins(), 30000);
// setTimeout(reRenderCoins(), 10000);

setInterval(reRenderCoins, 1000 * 60 * 60);

export default coins;
