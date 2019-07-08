var gd = require('node-gd');

let buffer = gd.createFromPng('../images/Coin/1b.png');

console.log(buffer);
buffer = buffer.setResolution(300, 300);
buffer.saveBmp('./123.bmp', 10);

