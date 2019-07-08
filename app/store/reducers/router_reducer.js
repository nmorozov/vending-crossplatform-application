import { fromJS } from 'immutable';

import {
  DISABLE_RETURN,
  ENABLE_RETURN,
} from '../actions/router_actions';

const initialState = fromJS({
  return: true
});

export default function routerReducer(state = initialState, action) {
  let newState = {};

  switch (action.type) {
    case DISABLE_RETURN:
      newState = state.set('return', false);
      break;
    case ENABLE_RETURN:
      newState = state.set('return', true);
      break;
    
    default:
      return state;
  }

  return newState || state;
}
