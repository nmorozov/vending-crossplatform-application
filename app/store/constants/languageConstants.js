const fs = require('fs');

import electron from 'electron';
const app = electron.remote.app;

import { EN, ZH, FR, HE, RU, IT, DE, ES } from './languageCodeConstants';

const rootFolder = app.imagesPath;

const languages = [
  {
    name: 'English',
    code: EN,
    image: `${rootFolder}/images/flags/english.png`
  },
  {
    name: 'Chinese',
    code: ZH,
    image: `${rootFolder}/images/flags/chinese.png`
  },
  {
    name: 'French',
    code: FR,
    image: `${rootFolder}/images/flags/french.png`
  },
  {
    name: 'Hebrew',
    code: HE,
    image: `${rootFolder}/images/flags/hebrew.png`
  },
  {
    name: 'Russian',
    code: RU,
    image: `${rootFolder}/images/flags/russian.png`
  },
  {
    name: 'Italian',
    code: IT,
    image: `${rootFolder}/images/flags/italian.png`
  },
  {
    name: 'German',
    code: DE,
    image: `${rootFolder}/images/flags/german.png`
  },
  {
    name: 'Spanish',
    code: ES,
    image: `${rootFolder}/images/flags/spanish.png`
  }
];

languages.map(language => {
  let image = fs.readFileSync(language.image);
  language.image = `data:image/png;base64,${image.toString('base64')}`;
});

export default languages;
