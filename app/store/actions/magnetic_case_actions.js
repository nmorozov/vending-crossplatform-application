import electron from 'electron';
const app = electron.remote.app;

import fs from 'fs';

export const FETCH_MAGNETIC_CASE_START = 'fetch_magnetic_case_start';
export const FETCH_MAGNETIC_CASE_FINISH = 'fetch_magnetic_case_start_finish';
export const FETCH_MAGNETIC_CASE_FAILED = 'fetch_magnetic_case_failed';

const fetchMagneticCaseStart = () => ({ type: FETCH_MAGNETIC_CASE_START });
const fetchMagneticCaseFinish = payload => ({
  type: FETCH_MAGNETIC_CASE_FINISH,
  payload
});

const rootFolder = app.imagesPath;

let envelopes = [];
try {
  envelopes = JSON.parse(fs.readFileSync(`${rootFolder}/images/Envelope/index.json`));
} catch (e) {
  console.error(e);
}

envelopes.map(envelope => {
  envelope.path = `${rootFolder}/images/Envelope/${envelope.filename}`;
  envelope.image = fs.readFileSync(envelope.path);
  envelope.base64Image = `data:image/png;base64,${envelope.image.toString('base64')}`;
  envelope.state = {};
})

export function fetchMagneticCase() {
  return dispatch => {
    dispatch(fetchMagneticCaseFinish(envelopes));
  };
}

export function setMagneticsState(states) {
  states.map(state => {
    envelopes[state.number-1] = envelopes[state.number-1] || {};
    envelopes[state.number-1].state = state;
  })

  return dispatch => {
    dispatch(fetchMagneticCaseFinish(envelopes));
  };
}
