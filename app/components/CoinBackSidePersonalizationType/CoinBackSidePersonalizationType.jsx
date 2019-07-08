import React from 'react';

import { Translate } from 'react-redux-i18n';

import Tappable from 'react-tappable';

// Types
import PropTypes from 'prop-types';
import coinBackSideTypes from '../../types/coinBackSideTypes';

// Styles
import styles from './CoinBackSidePersonalizationType.scss';

const coinBackSidePersonalizationType = ({
  coinPersonalizationType,
  onClick,
  tabIndex,
}) => (
  <Tappable
    onTouchEnd={onClick}
    role="button"
    tabIndex={tabIndex}
    key={coinPersonalizationType.name}
    className={styles.coin}
  >
    <div>
      <img
        src={coinPersonalizationType.image}
        alt={coinPersonalizationType.name}
      />
    </div>
    <div className={styles.name}>
      <Translate value={coinPersonalizationType.name} />
    </div>
    <div className={styles.description}>
      <Translate value={coinPersonalizationType.description} />
    </div>
  </Tappable>
);

coinBackSidePersonalizationType.propTypes = {
  coinPersonalizationType: coinBackSideTypes.isRequired,
  onClick: PropTypes.func.isRequired,
  tabIndex: PropTypes.number.isRequired,
};

export default coinBackSidePersonalizationType;
