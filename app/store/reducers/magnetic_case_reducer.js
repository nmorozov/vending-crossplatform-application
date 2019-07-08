import { fromJS } from 'immutable';

// Actions
import {
  FETCH_MAGNETIC_CASE_START,
  FETCH_MAGNETIC_CASE_FINISH,
} from '../actions/magnetic_case_actions';

const initialState = fromJS({
  magneticCases: [],
  isLoading: true,
});

export default function magneticCaseReducer(state = initialState, action) {
  let newState = {};
  switch (action.type) {
    case FETCH_MAGNETIC_CASE_START:
      if (action.from === 0) {
        newState = state.set('magneticCases', []);
      } else {
        newState = state.set('isLoading', true);
      }
      break;
    case FETCH_MAGNETIC_CASE_FINISH:
      newState = state
        .set('isLoading', false)
        .set('magneticCases', action.payload);
      break;
    default:
      return state;
  }
  return newState || state;
}
