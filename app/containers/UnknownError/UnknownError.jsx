import electron from 'electron';
import React, { Component } from 'react';
// i18n
import { Translate } from 'react-redux-i18n';

import kitonline from 'kit-online';

// Redux
import { connect } from 'react-redux';
import { navigateTo } from '../../store/actions/router_actions';
import { setPayInfo } from '../../store/actions/cart_actions';

// Prop Types
import PropTypes from 'prop-types';

// Constants
import { HOME } from '../../store/constants/routeConstants';

import styles from './UnknownError.scss';

const app = electron.remote.app;

const unknownErrorImage =
  process.env.NODE_ENV === 'production'
    ? './dist/images/unknown_error.png'
    : './images/unknown_error.png';

class UnknownError extends Component {
  static propTypes = {
    navigateTo: PropTypes.func.isRequired,
  };

  componentWillMount() {
    this.initIdleTimer();
    app.page = 'error';
    app.log('---> UnknownError <---');
    electron.remote.app.monitoring.currentPage = 'UnknownError';
    setTimeout(async () => {
      if (!app.config.disablePayment && !app.config.nextDisablePayment && app.payment) {
        let cost = app.config.coinPrice + app.config.envelopPrice;
        console.log(this.props.payInfo);
        if (app.payment.refund && this.props.payInfo.status) {
          kitonline.configKitOnline(Object.assign({}, app.config.kitOnline, {id: app.config.id}));
          let products = [{
            Price: cost * 100,
            Quantity: 1,
            SubjectName: app.config.kitOnline.productName,
            Tax: 1
          }];
          kitonline.requestRefundCheck(products).then(d => console.log(d));

          await app.payment.refund(cost * 100).catch(e => {
            this.props.setPayInfo({});
            throw e;
          });
        }
        this.props.setPayInfo({});
      }
    }, 1000);
  }

  componentWillUnmount() {
    clearTimeout(this.idleTimer);
  }
  componentDidMount() {
    console.log('------>componentDidMount');
  }

  idleTimer;

  initIdleTimer = () => {
    this.idleTimer = setTimeout(() => {
      this.props.navigateTo(HOME, true);
    }, electron.remote.app.config.idleTime * 1000);
  };
  render() {
    return (
      <div className={styles.wrapper}>
        <div className={styles.title}>
          <div className={styles.number}>1</div>
          <div className={styles.description}>
            <Translate value="selectGraphicsForTheFrontSide" dangerousHTML />
          </div>
        </div>
        <div className={styles.popupWrapper}>
          <div>
            <img src={unknownErrorImage} alt="fingerprint status" />
          </div>
          <div className={styles.unknownErrorTitle}>
            <Translate value="somethingWentWrong" />
          </div>
          <div className={styles.unknownErrorText}>
            <Translate value="weAreSorry" dangerousHTML />
          </div>
          <div className={styles.unknownErrorText}>
            <Translate value="contactOurTechnicalSupport" dangerousHTML />
          </div>
        </div>
      </div>
    );
  }
}

const actions = { navigateTo, setPayInfo };

function mapStateToProps(state) {
  return {
    payInfo: state.cartReducer.toJS().payInfo,
  };
}

export default connect(
  mapStateToProps,
  actions
)(UnknownError);
