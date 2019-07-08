import electron from 'electron';
const app = electron.remote.app;

const rootFolder = app.imagesPath;

const coinBacksidePersonalizationTypes = [
  {
    name: 'signature',
    description: 'putYourSignatureOrDrawAPicture',
    image: `${rootFolder}/images/UserInputTypeMenu/draw.png`
  },
  {
    name: 'fingerprint',
    description: 'yourOwnImprintOnAUniqueCoin',
    image: `${rootFolder}/images/UserInputTypeMenu/fingerprint.png`
  },
  {
    name: 'text',
    description: 'enterAShortSignatureOrInitials',
    image: `${rootFolder}/images/UserInputTypeMenu/text.png`
  }
];

export default coinBacksidePersonalizationTypes;
