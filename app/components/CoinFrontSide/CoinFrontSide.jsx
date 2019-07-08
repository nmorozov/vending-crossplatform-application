import electron from 'electron';
import React from 'react';

import Tappable from 'react-tappable';

// Types
import PropTypes from 'prop-types';
import coinFrontSideTypes from '../../types/coinFrontSideTypes';

// Styles
import styles from './CoinFrontSide.scss';

const app = electron.remote.app;

const saturate = app.config.imageСolorСorrection ? app.config.imageСolorСorrection.saturate : 100;
const brightness = app.config.imageСolorСorrection ? app.config.imageСolorСorrection.brightness : 100;
const grayscale = app.config.imageСolorСorrection ? app.config.imageСolorСorrection.grayscale : 0;
console.log('<---> sat=',saturate,' brig=',brightness,' gays=',grayscale);

const coinFrontSide = ({ coinFrontSideInfo, onClick, tabIndex }) => (
  <Tappable role="button" tabIndex={tabIndex} onTouchEnd={onClick} className={styles.coinFrontSideTappable} 
            style={{filter: 'saturate('+ saturate +'%) brightness('+ brightness +'%) grayscale(' + grayscale + '%)'}}>
    <div key={coinFrontSideInfo.id} className={styles.coinFrontSide} style={{backgroundSize: 189 * ((app.config.sizeCoinBackground || 100) / 100) + 'px'}}
          >
        <img 
          className={styles.coinFrontSide.img}
          src={coinFrontSideInfo.imageWithTextBase64}
          alt="coin"
        />
    </div>
  </Tappable>
);

coinFrontSide.propTypes = {
  coinFrontSideInfo: coinFrontSideTypes.isRequired,
  onClick: PropTypes.func.isRequired,
  tabIndex: PropTypes.number.isRequired,
};

export default coinFrontSide;
