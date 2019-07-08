import electron from 'electron';
import React, { Component } from 'react';

// i18n
import { Translate } from 'react-redux-i18n';

// Prop Types
import PropTypes from 'prop-types';

// Redux
import { connect } from 'react-redux';
import { navigateTo } from '../../store/actions/router_actions';

// Constants
import coinBacksidePersonalizationTypes from '../../store/constants/coinBacksidePersonalizationTypes';
import CoinBackSidePersonalizationType from '../../components/CoinBackSidePersonalizationType';
import { HOME } from '../../store/constants/routeConstants';

import { sendStat } from '../../store/actions/statistics';

// Styles
import styles from './CoinBackSideSelect.scss';

const app = electron.remote.app;

class CoinBackSideSelect extends Component {
  static propTypes = {
    navigateTo: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.initIdleTimer();
    app.log('---> CoinBackSideSelect <---');
    electron.remote.app.monitoring.currentPage = 'CoinBackSideSelect';
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

  selectBackSidePersonalizationType = personalizationType => {
    sendStat('select_client_type', personalizationType.name);
    this.props.navigateTo(`/${personalizationType.name}`);
  };

  renderPersonalizationTypes = () =>
    coinBacksidePersonalizationTypes.map((coinPersonalizationType, key) => (
      <CoinBackSidePersonalizationType
        key={coinPersonalizationType.name}
        tabIndex={key}
        onClick={() => {
          this.selectBackSidePersonalizationType(coinPersonalizationType);
        }}
        coinPersonalizationType={coinPersonalizationType}
      />
    ));

  render() {
    return (
      <div className={styles.wrapper}>
        <div className={styles.title}>
          <div className={styles.number}>2</div>
          <div className={styles.description}>
            <Translate value="chooseTheWayOfTheBackSidePersonalization" />
          </div>
        </div>
        <div className={styles.personalizationTypes}>
          {this.renderPersonalizationTypes()}
        </div>
      </div>
    );
  }
}

const actions = { navigateTo };

export default connect(
  null,
  actions
)(CoinBackSideSelect);
