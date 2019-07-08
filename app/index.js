import React from 'react';
import ReactDOM from 'react-dom';

// Redux
import { Provider } from 'react-redux';

// Router
import { Route, Switch } from 'react-router';
import { ConnectedRouter } from 'connected-react-router';
import { store, history } from './store';

// Constants
import {
  HOME,
  LANGUAGE_SELECT,
  PAGE_TEST_MODULES_SELECT,
  COIN_FRONT_SIDE_SELECT,
  COIN_BACK_SIDE_SELECT,
  SIGNATURE,
  TEXT,
  FINGERPRINT,
  MAGNETIC_CASE_SELECT,
  CHECKOUT,
  PLACE_ORDER,
  UNKNOWN_ERROR,
} from './store/constants/routeConstants';

// Components
import App from './containers/App/App';
import Home from './components/Home';
import LanguageSelect from './containers/LanguageSelect';
import PageTestModulSelect from './containers/PageTestModulSelect';
import CoinFrontSideSelect from './containers/CoinFrontSideSelect';
import CoinBackSideSelect from './containers/CoinBackSideSelect';
import Signature from './containers/Signature';
import Text from './containers/Text';
import Fingerprint from './containers/Fingerprint';
import MagneticCaseSelect from './containers/MagneticCaseSelect';
import Checkout from './containers/Checkout';
import PlaceOrder from './containers/PlaceOrder';
import UnknownError from './containers/UnknownError';

// Styles
import './index.scss';

import electron from 'electron';

window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
  electron.remote.app.error(`UNHANDLED ERROR: ${errorMsg} \n ${url}:${lineNumber}`);
  return false;
}

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <App>
        <Switch>
          <Route exact path={HOME} component={Home} />
          <Route path={LANGUAGE_SELECT} component={LanguageSelect} />
          <Route path={PAGE_TEST_MODULES_SELECT} component={PageTestModulSelect} />
          <Route path={COIN_FRONT_SIDE_SELECT} component={CoinFrontSideSelect} />
          <Route path={COIN_BACK_SIDE_SELECT} component={CoinBackSideSelect} />
          <Route path={SIGNATURE} component={Signature} />
          <Route path={TEXT} component={Text} />
          <Route path={FINGERPRINT} component={Fingerprint} />
          <Route path={MAGNETIC_CASE_SELECT} component={MagneticCaseSelect} />
          <Route path={CHECKOUT} component={Checkout} />
          <Route path={PLACE_ORDER} component={PlaceOrder} />
          <Route path={UNKNOWN_ERROR} component={UnknownError} />
        </Switch>
      </App>
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root')
);
