import electron from 'electron';
import React, { Component } from 'react';

// Prop Types
import PropTypes from 'prop-types';

// i18n
import { Translate } from 'react-redux-i18n';

// Redux
import { connect } from 'react-redux';
import { fetchCoinFrontSide } from '../../store/actions/coin_front_side_actions';
import { selectCoinFrontSide } from '../../store/actions/cart_actions';
import { navigateTo } from '../../store/actions/router_actions';

// Constants
import {
  COIN_BACK_SIDE_SELECT,
  MAGNETIC_CASE_SELECT,
  HOME,
} from '../../store/constants/routeConstants';
import CoinsList from '../../store/constants/coinFrontsideConstants';
import { sendStat } from '../../store/actions/statistics';

// Types
import coinFrontSideTypes from '../../types/coinFrontSideTypes';

// Components
import CoinFrontSide from '../../components/CoinFrontSide';

// Styles
import styles from './CoinFrontSideSelect.scss';

const app = electron.remote.app;

class CoinFrontSideSelect extends Component {
  static propTypes = {
    fetchCoinFrontSide: PropTypes.func.isRequired,
    selectCoinFrontSide: PropTypes.func.isRequired,
    navigateTo: PropTypes.func.isRequired,
    coinFrontSides: PropTypes.arrayOf(coinFrontSideTypes).isRequired,
  };

  componentWillMount() {
    this.props.fetchCoinFrontSide();
    this.initIdleTimer();
    app.log('---> CoinFrontSideSelect <---');
    electron.remote.app.monitoring.currentPage = 'CoinFrontSideSelect';
  }

  componentWillUnmount() {
    clearTimeout(this.idleTimer);
  }

  idleTimer;

  initIdleTimer = () => {
    this.idleTimer = setTimeout(() => {
      this.props.navigateTo(HOME, true);
    }, electron.remote.app.config.idleTime * 1000);
  };

  selectCoinFrontSide = coinFrontSideObject => {
    sendStat('select_image', coinFrontSideObject.id);
    this.props.selectCoinFrontSide(coinFrontSideObject);
    this.props.navigateTo(COIN_BACK_SIDE_SELECT);
  };

  renderCoinFrontSide = () => {
    if (CoinsList.length > 0) {
      return CoinsList.map((value, key) => (
        <CoinFrontSide
          key={value.id}
          tabIndex={key}
          coinFrontSideInfo={value}
          onClick={() => {
            this.selectCoinFrontSide(value);
          }}
        />
      ));
    }
    return <div />;
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
        <div className={styles.coinsList}>{this.renderCoinFrontSide()}</div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    coinFrontSides: state.coinFrontSideReducer.toJS().coinFrontSides,
    isLoading: state.coinFrontSideReducer.get('isLoading'),
  };
}

const actions = {
  fetchCoinFrontSide,
  selectCoinFrontSide,
  navigateTo,
};

export default connect(
  mapStateToProps,
  actions
)(CoinFrontSideSelect);
