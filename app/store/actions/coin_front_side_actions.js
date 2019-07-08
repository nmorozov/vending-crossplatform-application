import electron from 'electron';
const app = electron.remote.app;

export const FETCH_COIN_FRONT_SIDE_START = 'fetch_coin_front_side_start';
export const FETCH_COIN_FRONT_SIDE_FINISH =
  'fetch_coin_front_side_start_finish';
export const FETCH_COIN_FRONT_SIDE_FAILED = 'fetch_coin_front_side_failed';

const fetchCoinFrontSideStart = () => ({ type: FETCH_COIN_FRONT_SIDE_START });
const fetchCoinFrontSideFinish = payload => ({
  type: FETCH_COIN_FRONT_SIDE_FINISH,
  payload
});

export function fetchCoinFrontSide() {
  const rootFolder = app.imagesPath;

  const coinsFrontSideMock = [
    {
      id: 1,
      image: `${rootFolder}/images/Coin/1b.png`,
      backImage: `${rootFolder}/images/Coin/1f.png`
    },
    {
      id: 2,
      image: `${rootFolder}/images/Coin/2b.png`,
      backImage: `${rootFolder}/images/Coin/2f.png`
    },
    {
      id: 3,
      image: `${rootFolder}/images/Coin/3b.png`,
      backImage: `${rootFolder}/images/Coin/3f.png`
    },
    {
      id: 4,
      image: `${rootFolder}/images/Coin/4b.png`,
      backImage: `${rootFolder}/images/Coin/4f.png`
    },
    {
      id: 5,
      image: `${rootFolder}/images/Coin/5b.png`,
      backImage: `${rootFolder}/images/Coin/5f.png`
    }
  ];

  return dispatch => {
    dispatch(fetchCoinFrontSideStart());
    dispatch(fetchCoinFrontSideFinish(coinsFrontSideMock));
  };
}
