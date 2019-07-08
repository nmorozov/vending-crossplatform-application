import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import { createHashHistory } from 'history';
import { connectRouter, routerMiddleware } from 'connected-react-router';

import {
  loadTranslations,
  setLocale,
  syncTranslationWithStore,
  i18nReducer,
} from 'react-redux-i18n';
import translationsObject from '../i18n/translations';
import { RU } from './constants/languageCodeConstants';

// Reducers
import coinFrontSideReducer from './reducers/coin_front_side_reducer';
import cartReducer from './reducers/cart_reducer';
import routerReducer from './reducers/router_reducer';
import magneticCaseReducer from './reducers/magnetic_case_reducer';

const history = createHashHistory();

const middleware = routerMiddleware(history);

const store = createStore(
  connectRouter(history)(
    combineReducers({
      i18n: i18nReducer,
      coinFrontSideReducer,
      cartReducer,
      routerReducer,
      magneticCaseReducer,
    })
  ),
  applyMiddleware(middleware, thunk)
);

syncTranslationWithStore(store);
store.dispatch(loadTranslations(translationsObject));
store.dispatch(setLocale(RU));

export { store, history };
