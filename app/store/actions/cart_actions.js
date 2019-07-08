export const SELECT_COIN_FRONT_SIDE = 'select_coin_front_side';
export const SELECT_COIN_BACK_SIDE = 'select_coin_back_side';
export const SELECT_MAGNETIC_CASE = 'select_magnetic_case';
export const SET_PAY_INFO = 'set_pay_info';

const changeCartAttribute = (payload, type) => ({
  type,
  payload,
});

export function selectCoinFrontSide(coinFrontSideObject) {
  return dispatch => {
    dispatch(changeCartAttribute(coinFrontSideObject, SELECT_COIN_FRONT_SIDE));
  };
}

export function selectCoinBackSide(coinBackSideObject) {
  return dispatch => {
    dispatch(changeCartAttribute(coinBackSideObject, SELECT_COIN_BACK_SIDE));
  };
}

export function selectMagneticCase(magneticCaseObject) {
  return dispatch => {
    dispatch(changeCartAttribute(magneticCaseObject, SELECT_MAGNETIC_CASE));
  };
}

export function setPayInfo(payInfo) {
  return dispatch => {
    dispatch(changeCartAttribute(payInfo, SET_PAY_INFO));
  };
}
