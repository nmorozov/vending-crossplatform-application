// Navigation
import { push, replace } from 'connected-react-router';

export const DISABLE_RETURN = 'disable_return';
export const ENABLE_RETURN = 'enable_return';

export function navigateTo(url, replaceHistory = false) {
  return dispatch => {
    if (replaceHistory === false) {
      dispatch(push(url));
    } else {
      dispatch(replace(url));
    }
  };
}

export function disableReturn() {
  return dispatch => dispatch({type: DISABLE_RETURN, payload: {}});
}

export function enableReturn() {
  return dispatch => dispatch({type: ENABLE_RETURN, payload: {}});
}
