import fs from 'fs';
import electron from 'electron';

class ImageFile {
  static folderName = '/image/';

  static save(filename, content) {
    const userDataPath = this.getUserDataPath();
    const base64Content = this.convertToBase64(content);
    const savePath = `${userDataPath}${this.folderName}`;

    if (!fs.existsSync(savePath)) {
      fs.mkdir(savePath, '0777', (err => {
        fs.writeFile(`${savePath}${filename}`, base64Content, err => {});
      }));
    }

    return `${savePath}${filename}`;
  }

  static convertToBase64(content) {
    const data = content.replace(/^data:image\/\w+;base64,/, '');

    return Buffer.from(data, 'base64');
  }

  static getUserDataPath() {
    return (electron.app || electron.remote.app).getPath('userData');
  }
}

export default ImageFile;

export function getCircularText(text, diameter, startAngle, align, textInside, inwardFacing, style) {
  // text:         The text to be displayed in circular fashion
  // diameter:     The diameter of the circle around which the text will
  //               be displayed (inside or outside)
  // startAngle:   In degrees, Where the text will be shown. 0 degrees
  //               if the top of the circle
  // align:        Positions text to left right or center of startAngle
  // textInside:   true to show inside the diameter. False to show outside
  // inwardFacing: true for base of text facing inward. false for outward
  // fName:        name of font family. Make sure it is loaded
  // fSize:        size of font family. Don't forget to include units
  // kearning:     0 for normal gap between letters. positive or
  //               negative number to expand/compact gap in pixels
//------------------------------------------------------------------------

  let defaulStyle = {
    fontFamily: 'Arial',
    fontSize: 20,
    fontWeight: 'normal',
    kerning: 2,
    color: 'black',
  }

  style = Object.assign({}, defaulStyle, style);
  // declare and intialize canvas, reference, and useful variables
  align = align.toLowerCase();
  let mainCanvas = document.createElement('canvas');
  let ctxRef = mainCanvas.getContext('2d');
  let clockwise = align === "right" ? 1 : -1; // draw clockwise for aligned right. Else Anticlockwise
  startAngle = startAngle * (Math.PI / 180); // convert to radians

  // calculate height of the font. Many ways to do this
  // you can replace with your own!
  let div = document.createElement("div");
  div.innerHTML = text;
  div.style.position = 'absolute';
  div.style.top = '-10000px';
  div.style.left = '-10000px';
  div.style.fontFamily = style.fontFamily;
  div.style.fontSize = style.fontSize;
  div.style.fontWeight = style.fontWeight;
  document.body.appendChild(div);
  let textHeight = div.offsetHeight;
  document.body.removeChild(div);

  // in cases where we are drawing outside diameter,
  // expand diameter to handle it
  if (!textInside) diameter += textHeight * 2;

  mainCanvas.width = diameter;
  mainCanvas.height = diameter;
  // omit next line for transparent background
  ctxRef.fillStyle = style.color;
  ctxRef.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

  // Reverse letters for align Left inward, align right outward
  // and align center inward.
  if (((["left", "center"].indexOf(align) > -1) && inwardFacing) || (align === "right" && !inwardFacing)) text = text.split("").reverse().join(""); 

  // Setup letters and positioning
  ctxRef.translate(diameter / 2, diameter / 2); // Move to center
  startAngle += (Math.PI * !inwardFacing); // Rotate 180 if outward
  ctxRef.textBaseline = 'middle'; // Ensure we draw in exact center
  ctxRef.textAlign = 'center'; // Ensure we draw in exact center

  // rotate 50% of total angle for center alignment
  if (align === "center") {
      for (let j = 0; j < text.length; j++) {
          let charWid = ctxRef.measureText(text[j]).width;
          startAngle += ((charWid + (j === text.length-1 ? 0 : style.kerning)) / (diameter / 2 - textHeight)) / 2 * -clockwise;
      }
  }

  // Phew... now rotate into final start position
  ctxRef.rotate(startAngle);

  // Now for the fun bit: draw, rotate, and repeat
  for (let j = 0; j < text.length; j++) {
      let charWid = ctxRef.measureText(text[j]).width; // half letter
      // rotate half letter
      ctxRef.rotate((charWid/2) / (diameter / 2 - textHeight) * clockwise);
      // draw the character at "top" or "bottom"
      // depending on inward or outward facing
      ctxRef.fillText(text[j], 0, (inwardFacing ? 1 : -1) * (0 - diameter / 2 + textHeight / 2));

      ctxRef.rotate((charWid/2 + style.kerning) / (diameter / 2 - textHeight) * clockwise); // rotate half letter
  }

  // Return it
  return (mainCanvas);
}