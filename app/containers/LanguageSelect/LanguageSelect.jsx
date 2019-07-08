import electron from 'electron';
import React, { Component } from 'react';

// Prop types
import PropTypes from 'prop-types';

// Redux
import { connect } from 'react-redux';
import { navigateTo } from '../../store/actions/router_actions';

// Languages
import { setLocale } from 'react-redux-i18n';
import LanguagesList from '../../store/constants/languageConstants';

import { reRenderCoins } from '../../store/constants/coinFrontsideConstants';

import { setMagneticsState } from '../../store/actions/magnetic_case_actions';
import { selectCoinFrontSide } from '../../store/actions/cart_actions';
import { sendStat } from '../../store/actions/statistics';

// Constants
import {
  COIN_FRONT_SIDE_SELECT,
  COIN_BACK_SIDE_SELECT,
  PAGE_TEST_MODULES_SELECT,
  HOME,
  UNKNOWN_ERROR,
} from '../../store/constants/routeConstants';

// Components
import LanguageComponent from '../../components/Language/Language';

import Logger from '../../utils/Logger';

// Styles
import styles from './LanguageSelect.scss';

const app = electron.remote.app;

class languageSelect extends Component {
  static propTypes = {
    navigateTo: PropTypes.func.isRequired,
    setLocale: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      printServerConnected: true,
      noErrors: false
    };

    this.initIdleTimer();
  }

  componentDidMount() {
    if (app.payment && !app.config.disablePayment && !app.config.nextDisablePayment)
      app.payment.enable && app.payment.enable();

    if (app.board && app.config.enableCleanPrinter && app.board.lastClean < (Date.now() - app.config.cleanTimeout))
      app.board.cleanHead();
  }

  componentWillUnmount() {
    clearTimeout(this.idleTimer);
  }

  async checkPrinter() {
    let board = app.board;

    let coin = await board.checkCoin();
    if (coin.error) {
      app.error(coin.errorName);
      throw new Error('Coin error');
    }

    let printer = await board.checkPrinter();
    console.log('---->printer.error=',printer.error);
    if (printer.error) {
      app.error(printer.errorName);
      throw new Error('Printer error');
    }

    let envelops = await board.checkAllEnvelops();
    this.props.setMagneticsState(envelops);
    for (let i = 0; i < envelops.length; i++) {
      if (!envelops.error) return;
    }

    throw new Error('All envelops error');
  }

  idleTimer;
  initIdleTimer = () => {
    this.idleTimer = setTimeout(() => {
      this.props.navigateTo(HOME, true);
    }, app.config.idleTime * 1000);
  };

  selectLanguage = async code => {
    this.props.setLocale(code);

    if (!app.config.disablePrinter) {
      await this.checkPrinter().catch(err => {
        app.error(err);
        this.props.navigateTo(UNKNOWN_ERROR);
        throw err;
      });
    }

    if (!app.config.disablePayment && !app.config.nextDisablePayment && !app.payment) {
      app.error('Payment terminal not connected');
      this.props.navigateTo(UNKNOWN_ERROR);
      return;
    }

    sendStat('select_language', code);
    if (!app.config.enabledTestModule){
      this.props.navigateTo(COIN_FRONT_SIDE_SELECT);
    }
    else {
      this.props.navigateTo(PAGE_TEST_MODULES_SELECT);
    }
  };

  renderLanguages = Languages =>
    Languages.map((language, key) => (
      <LanguageComponent
        language={language}
        key={language.name}
        tabIndex={key}
        onClick={(e) => this.selectLanguage(language.code, e)}
      />
    ));

  render() {
    return (
      <div className={styles.languages_list}>
        {this.renderLanguages(LanguagesList)}
      </div>
    );
  }
}

function mapDipatchToProps(dispatch) {
  return {
    navigateTo: (location, replaceHistory) => {
      dispatch(navigateTo(location, replaceHistory));
    },
    setLocale: code => {
      dispatch(setLocale(code));
    },
    setMagneticsState: envelops => {
      dispatch(setMagneticsState(envelops))
    },
  };
}


function mapStateToProps(state) {
  return {
    coinFrontSides: state.coinFrontSideReducer.toJS().coinFrontSides,
  };
}

export default connect(
  mapStateToProps,
  mapDipatchToProps
)(languageSelect);
