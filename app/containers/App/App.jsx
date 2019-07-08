import React, { Component } from 'react';

import Tappable from 'react-tappable';

// Redux
import { connect } from 'react-redux';
import { navigateTo } from '../../store/actions/router_actions';

// Router
import { goBack } from 'connected-react-router';

// i18n
import { Translate } from 'react-redux-i18n';

// Prop types
import PropTypes from 'prop-types';
import locationShape from '../../types/locationTypes';

// Images
import logo from './images/check_in_coin_logo.png';
import backButton from './images/go_back.png';

// Constants
import {
  HOME,
} from '../../store/constants/routeConstants';

// Styles
import styles from './App.scss';

class App extends Component {
  static propTypes = {
    location: locationShape.isRequired,
    dispatch: PropTypes.func.isRequired,
    navigateTo: PropTypes.func.isRequired,
  };

  locationsWithoutHeader = ['/', '/place_order'];
  locationsWithoutBackButton = [
    '/language_select',
    '/fingerprint',
    '/unknown_error',
  ];

  goBack = () => (this.props.return && this.props.dispatch(goBack()));

  renderHeader = () => {
    if (
      this.locationsWithoutHeader.indexOf(this.props.location.pathname) === -1
    ) {
      return (
        <header className={styles.header}>
          {this.renderBackButton()}
          <div
            role="Button"
            tabIndex={-1}
            onTouchEnd={() => {
              this.props.navigateTo(HOME, true);
            }}
            style={{ fontFace: 'Montserrat', fontWeight: 'bold' }}
          >
            <img src={logo} className={styles.logo} alt="Logo" />
          </div>
        </header>
      );
    }

    return <div />;
  };

  renderBackButton = () => {
    if (
      this.locationsWithoutBackButton.indexOf(this.props.location.pathname) ===
      -1
    ) {
      return (
        <Tappable
          role="button"
          className={styles.backButtonContainer}
          tabIndex={0}
          onTouchEnd={this.goBack}
        >
          <img src={backButton} className={styles.logo} alt="Go back" />
          <Translate value="return" />
        </Tappable>
      );
    }
    return <div />;
  };

  render() {
    return (
      <div className={styles.app}>
        {this.renderHeader()}
        {this.props.children}
      </div>
    );
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    navigateTo: (page) => dispatch(navigateTo(page)),
  };
}

const mapStateToProps = state => ({
  location: state.router.location,
  return: state.routerReducer.toJS().return,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App);
