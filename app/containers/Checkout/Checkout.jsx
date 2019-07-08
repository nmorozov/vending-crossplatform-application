import electron from 'electron';
import React, { Component } from 'react';

import kitonline from 'kit-online';

import Tappable from 'react-tappable';

// Prop Types
import PropTypes from 'prop-types';

// i18n
import { Translate } from 'react-redux-i18n';

// Redux
import { connect } from 'react-redux';
import { navigateTo, disableReturn, enableReturn } from '../../store/actions/router_actions';
import { setPayInfo } from '../../store/actions/cart_actions';

// Types
import coinFrontSideTypes from '../../types/coinFrontSideTypes';
import coinBackSideTypes from '../../types/coinBackSideTypes';
import magneticCaseTypes from '../../types/magneticCaseTypes';

// Constants
import { PLACE_ORDER, UNKNOWN_ERROR, HOME } from '../../store/constants/routeConstants';

// Styles
import styles from './Checkout.scss';

// Images
import hintPng from './images//arrow.png';
const app = electron.remote.app;

class Checkout extends Component {
  static propTypes = {
    navigateTo: PropTypes.func.isRequired,
    coinFrontSide: coinFrontSideTypes.isRequired,
    coinBackSide: coinBackSideTypes.isRequired,
    magneticCase: magneticCaseTypes.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      payProcess: null,
      payCancelled: false
    };
  this.initIdleTimer();
  app.log('---> Checkout <---');
  electron.remote.app.monitoring.currentPage = 'Checkout';
  }

  async componentWillUnmount() {
    clearTimeout(this.idleTimer);
    this.props.enableReturn();
  }

  idleTimer;
  initIdleTimer = () => {
    this.idleTimer = setTimeout(() => {
      this.props.navigateTo(HOME, true);
    }, app.config.idleTime * 2 * 1000);
  };

  goToPlaceOrder = async () => {
    let payment = app.payment;
    let config = app.config;
    let cost = config.coinPrice + config.envelopPrice;

    clearTimeout(this.idleTimer);

    this.props.disableReturn();

    if (this.state.payProcess) return;

    try {
      if (!app.config.disablePayment && !app.config.nextDisablePayment) {
        this.setState({payProcess: true});

        await new Promise((resolve, reject) => setTimeout(async () => {
          let payInfo;
          try {
            payInfo = await payment.pay(cost * 100);
          } catch (e) {}
          if (!payInfo) return reject(new Error('PAY ERROR'));
          console.log(payInfo);
          this.props.setPayInfo(payInfo);

          kitonline.configKitOnline(Object.assign({}, app.config.kitOnline, {id: app.config.id}));
          let products = [{
            Price: cost * 100,
            Quantity: 1,
            SubjectName: app.config.kitOnline.productName,
            Tax: 1
          }];
          kitonline.requestCheck(products)
            .then(d => app.log('KitOnline check:', d))
            .catch(e => app.error('KitOnline error:', e.message));

          this.setState({payProcess: null});

          resolve();
          this.props.navigateTo(PLACE_ORDER);
        }, 500));

      } else {
        this.setState({payProcess: true});
        await new Promise(resolve => setTimeout(() => resolve(), 3000));
        this.setState({payProcess: null});
        this.props.navigateTo(PLACE_ORDER);
      }

    } catch (e) {
      app.error(e);

      this.setState({payProcess: null});

      if (config.debugPayment) {
        this.props.navigateTo(PLACE_ORDER);
      } else {
        this.props.navigateTo(UNKNOWN_ERROR);
      }

    }

  };

  render() {
    const backgroundImageStyle = {
      height: '175px',
      backgroundSize: '175px 175px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
    // const hintPng = app.imagesPath + '/images/arrow.png';
    let config = app.config;
    let cost = parseInt(config.coinPrice) + parseInt(config.envelopPrice);
    return (
      <div className={styles.wrapper}>
        <div className={styles.title}>
          <div className={styles.description}>
            <Translate value="yourOrder" />
          </div>
        </div>
        <div className={styles.orderItems}>
          <div className={styles.orderItem}>
            <div className={styles.coinBackground}>
              <img
                src={this.props.coinFrontSide.imageWithTextBase64}
                alt={<Translate value="frontSide" />}
                className={styles.image}
              />
            </div>
            <div className={styles.orderItemTittle}>
              <Translate value="frontSide" />
            </div>
          </div>
          <div className={styles.orderItem}>
            <div style={backgroundImageStyle} className={styles.coinBackground}>
              <img
                src={this.props.coinBackSide.imageBase64}
                alt={<Translate value="backSide" />}
                className={styles.backSideImage}
              />
            </div>
            <div className={styles.orderItemTittle}>
              <Translate value="backSide" />
            </div>
          </div>
          <div className={styles.orderItem}>
            <div>
              <img
                src={this.props.magneticCase.base64Image}
                alt={<Translate value="magneticCase" />}
                className={styles.image}
              />
            </div>
            <div className={styles.orderItemTittle}>
              <Translate value="magneticCase" />
            </div>
          </div>
        </div>
        <div className={styles.instructionsContainer}>
          <div>
            <Translate value="costOfYourOrder" className={styles.instruction} />
          </div>
          <div className={styles.orderCost}>
            {cost} <Translate value="rubles" />
          </div>
          <div>
            <Translate
              value="confirmTheOrder"
              dangerousHTML
              className={styles.instruction}
            />
          </div>
          <Tappable
            className={`${styles.button} ${styles.confirm} ${this.state.payProcess && styles.buttonDisable}`}
            onTouchEnd={this.goToPlaceOrder}
            tabIndex={-1}
            role="button"
            component="div"
          >
            <Translate value="confirm" />
          </Tappable>
        </div>
        {this.state.payProcess && (
          <div className={styles.hint}>
            <img className={styles.hint.img} src={hintPng} alt="hint" />
          </div>
        )}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    coinFrontSide: state.cartReducer.toJS().coinFrontSide,
    coinBackSide: state.cartReducer.toJS().coinBackSide,
    magneticCase: state.cartReducer.toJS().magneticCase,
  };
}

const actions = { navigateTo, disableReturn, enableReturn, setPayInfo };

export default connect(
  mapStateToProps,
  actions
)(Checkout);
