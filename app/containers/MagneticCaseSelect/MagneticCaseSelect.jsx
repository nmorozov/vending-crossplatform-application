import electron from 'electron';
import React, { Component } from 'react';

// Prop Types
import PropTypes from 'prop-types';

// i18n
import { Translate } from 'react-redux-i18n';

// Redux
import { connect } from 'react-redux';
import { fetchMagneticCase, setMagneticsState } from '../../store/actions/magnetic_case_actions';
import { selectMagneticCase } from '../../store/actions/cart_actions';
import { navigateTo } from '../../store/actions/router_actions';
import { sendStat } from '../../store/actions/statistics';

// Constants
import { CHECKOUT, HOME } from '../../store/constants/routeConstants';

// Types
import magneticCaseTypes from '../../types/magneticCaseTypes';

// Components
import MagneticCase from '../../components/MagneticCase';

import Logger from '../../utils/Logger';

// Styles
import styles from './MagneticCaseSelect.scss';

const app = electron.remote.app;

class MagneticCaseSelect extends Component {
  static propTypes = {
    fetchMagneticCase: PropTypes.func.isRequired,
    selectMagneticCase: PropTypes.func.isRequired,
    navigateTo: PropTypes.func.isRequired,
    magneticCases: PropTypes.arrayOf(magneticCaseTypes).isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      magneticCaseAvailability : [true, true, true, true],
    };

    this.props.magneticCases.map(mag => this.state.magneticCaseAvailability[mag.num-1] = !mag.state.error);
    app.log('---> MagneticCaseSelect <---');
    electron.remote.app.monitoring.currentPage = 'MagneticCaseSelect';
  }

  componentWillMount() {
    this.props.fetchMagneticCase();
    this.initIdleTimer();
    if (!app.config.disablePrinter) this.checkEnvelops();
  }

  componentWillUnmount() {
    clearTimeout(this.idleTimer);
  }

  async checkEnvelops() {
    let board = app.board;

    let envelops = await board.checkAllEnvelops();
    this.props.setMagneticsState(envelops);
    
    const magneticCaseResponse = [true, true, true, true];
    for (let i = 0; i < envelops.length; i++) {
      magneticCaseResponse[i] = !envelops[i].error;
    }

    throw new Error('All envelops error');
  }

  idleTimer;
  initIdleTimer = () => {
    this.idleTimer = setTimeout(() => {
      this.props.navigateTo(HOME, true);
    }, app.config.idleTime * 1000);
  };

  selectMagneticCase = magneticCaseObject => {
    sendStat('select_envelope', magneticCaseObject.id);
    this.props.selectMagneticCase(magneticCaseObject);
    this.props.navigateTo(CHECKOUT);
  };

  renderMagneticCase = () => {
    if (this.props.magneticCases.length > 0) {
      return this.props.magneticCases.map((value, key) => (
        <MagneticCase
          key={value.id}
          available={this.state.magneticCaseAvailability[key]}
          tabIndex={key}
          magneticCaseInfo={value}
          onClick={() => {
            this.selectMagneticCase(value);
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
          <div className={styles.number}>3</div>
          <div className={styles.description}>
            <Translate value="chooseAFreeMagneticCase" dangerousHTML />
          </div>
        </div>
        <div className={styles.magneticCasesList}>
          {this.renderMagneticCase()}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    magneticCases: state.magneticCaseReducer.toJS().magneticCases,
    isLoading: state.magneticCaseReducer.get('isLoading'),
  };
}

const actions = {
  fetchMagneticCase,
  setMagneticsState,
  selectMagneticCase,
  navigateTo,
};

export default connect(
  mapStateToProps,
  actions
)(MagneticCaseSelect);
