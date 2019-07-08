import { fromJS } from 'immutable';

// Actions
import {
  FETCH_COIN_FRONT_SIDE_START,
  FETCH_COIN_FRONT_SIDE_FINISH,
} from '../actions/coin_front_side_actions';

const initialState = fromJS({
  coinFrontSides: [],
  isLoading: true,
});

export default function coinFrontSideReducer(state = initialState, action) {
  let newState = {};
  switch (action.type) {
    case FETCH_COIN_FRONT_SIDE_START:
      if (action.from === 0) {
        newState = state.set('coinFrontSides', []);
      } else {
        newState = state.set('isLoading', true);
      }
      break;
    case FETCH_COIN_FRONT_SIDE_FINISH:
      newState = state
        .set('isLoading', false)
        .set('coinFrontSides', action.payload);
      break;
    default:
      return state;
  }
  return newState || state;
}
