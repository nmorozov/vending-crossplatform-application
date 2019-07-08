import { fromJS } from 'immutable';

import {
  SELECT_COIN_FRONT_SIDE,
  SELECT_COIN_BACK_SIDE,
  SELECT_MAGNETIC_CASE,
  SET_PAY_INFO,
} from '../actions/cart_actions';

const initialState = fromJS({
  coinFronSide: {},
  coinBackSide: {},
  magneticCase: {},
  payInfo: {}
});

export default function cartReducer(state = initialState, action) {
  let newState = {};

  switch (action.type) {
    case SELECT_COIN_FRONT_SIDE:
      newState = state.set('coinFrontSide', action.payload);
      break;
    case SELECT_COIN_BACK_SIDE:
      newState = state.set('coinBackSide', action.payload);
      break;
    case SELECT_MAGNETIC_CASE:
      newState = state.set('magneticCase', action.payload);
      break;
    case SET_PAY_INFO:
      newState = state.set('payInfo', action.payload);
      break;
    default:
      return state;
  }

  return newState || state;
}
