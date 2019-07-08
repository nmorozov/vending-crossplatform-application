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

// import { reRenderCoins } from '../../store/constants/coinFrontsideConstants';

import { setMagneticsState } from '../../store/actions/magnetic_case_actions';
import { sendStat } from '../../store/actions/statistics';

// Constants
import {
  COIN_FRONT_SIDE_SELECT,
  HOME,
  UNKNOWN_ERROR,
} from '../../store/constants/routeConstants';

// Components
import LanguageComponent from '../../components/Language/Language';

import Logger from '../../utils/Logger';

// Styles
import styles from './PageTestModules.scss';

const app = electron.remote.app;

const COMMAND_ROLL_REINIT_ENVELOP = 0x0E;
const COMMAND_ROLL_RESET_ERR_BOARD = 0x0F;

class testModules extends Component {
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
    app.log('---> PageTestModules <---');
    electron.remote.app.monitoring.currentPage = 'PageTestModules';
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
    }, app.config.idleTime * 10000);
  };

  getButtonName(type) {
    switch (type) {
      case 1: return '"issue envelope 1"';
      case 2: return '"issue envelope 2"';
      case 3: return '"issue envelope 3"';
      case 4: return '"issue envelope 4"';
      case 5: return '';
      case 6: return '';
      case 7: return '';
      case 8: return '';
      case 9: return '';
      case 10: return '';
      case 11: return '';
      case 12: return '';
      case 13: return '';
      default: return 'unknown_type';
    }
  }

  handleClick = async (param) =>{
    console.log('---нажата кнопка ', param, ':', this.getButtonName(param) );
    let board = app.board;
    let res;
    switch (param) {
      case 1:
      case 2:
      case 3:
      case 4:
        console.log('--->выдача конверта №',param);
        app.log('--->выдача конверта №',param);
        board.tryGetEnvelop(param);
        break;
      case 5:
        console.log('--->протяняжка каретки');
        app.log('--->протяняжка каретки');
        board.rollCarriage();
        break;
      case 6:
        console.log('--->протяняжка каретки до ошибки');
        app.log('--->протяняжка каретки до ошибки');
        board.rollCarriage();
        break;
      case 7:
        console.log('---реинициализация конвертов');
        app.log('---реинициализация ковертов');
        board.coverReinit();
        break;
      case 8:
        console.log('---сброс ошибки платы');
        app.log('---сброс ошибки платы');
        board.resetErrorBoard();
        break;
      case 9:
        console.log('---печать монетки');
        app.log('---печать монетки');
        let image = app.config.testModules.image;//"/var/tmp/test.tif";
        let client = app.config.testModules.client;//"/var/tmp/R.bmp";
        let mask = app.config.testModules.mask;//"/var/tmp/A.bmp";
        let envelop = app.config.testModules.envelop;//1;
        // board.print(image,client,mask,envelop);
        await this.printAwers(image, mask, 1);
        await this.tryGetEnvelop(envelop);
        await this.printRewers(client, null, null);
        break;
      case 10:
        console.log('--->команда: нажать кнопку on/off на принтере');
        app.log('--->команда: нажать кнопку on/off на принтере');
        board.printerButtonOnOff(0);
        break;
      case 11:
        console.log('--->команда: включить принтер');
        app.log('--->команда: включить принтер');
        board.printerButtonOnOff(1);
        break;
      case 12:
        console.log('--->команда: выключить принтер');
        app.log('--->команда: выключить принтер');
        board.printerButtonOnOff(2);
        break;
      case 13:
        console.log('--->команда: global reboot device');
        app.log('--->команда: global reboot device');
        board.deviceGlobalRebut();
        break;

      default:
      console.log( 'Чтото пошло не так. Действие для нажатой кнопки не найдено' );
    }
  }

  render() {
    return (
      <div className={styles.testModules_list}>
        <button onTouchEnd={() => this.handleClick(1)}> выдать конверт номер 1 </button>
        <button onTouchEnd={() => this.handleClick(2)}> выдать конверт номер 2 </button>
        <button onTouchEnd={() => this.handleClick(3)}> выдать конверт номер 3 </button>
        <button onTouchEnd={() => this.handleClick(4)}> выдать конверт номер 4 </button>
        <button onTouchEnd={() => this.handleClick(5)}> протянуть каретку </button>
        <button onTouchEnd={() => this.handleClick(6)} disabled="true"> протянуть каретку до ошибки </button>
        <button onTouchEnd={() => this.handleClick(7)}> реинициализация ковертов </button>
        <button onTouchEnd={() => this.handleClick(8)}> сброс ошибки платы </button>
        <button onTouchEnd={() => this.handleClick(9)} disabled="true"> печать монетки </button>
        <button onTouchEnd={() => this.handleClick(10)}> нажать кнопку on/off на принтере </button>
        <button onTouchEnd={() => this.handleClick(11)}> включить принтер </button>
        <button onTouchEnd={() => this.handleClick(12)}> выключить принтер </button>
        <button onTouchEnd={() => this.handleClick(13)}> global reboot device </button>

        <button onTouchEnd={() => this.props.navigateTo(COIN_FRONT_SIDE_SELECT)}> перейти на следующую страницу </button>
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
)(testModules);
