import React from 'react';

import Tappable from 'react-tappable';

import { Translate } from 'react-redux-i18n';

// Types
import PropTypes from 'prop-types';
import magneticCaseTypes from '../../types/magneticCaseTypes';

// Styles
import styles from './MagneticCase.scss';

const magneticCase = ({ magneticCaseInfo, available, onClick, tabIndex }) => (
  <div key={magneticCaseInfo.id} className={styles.magneticCase}>
    <Tappable
      role="button"
      tabIndex={tabIndex}
      onTouchEnd={available ? onClick : () => {}}
    >
      {!available && (
        <div className={styles.unavailable}>
          <Translate value="absent" dangerousHTML />
        </div>
      )}
      <img
        style={!available ? { opacity: 0.5 } : {}}
        src={magneticCaseInfo.base64Image}
      />
    </Tappable>
  </div>
);

magneticCase.propTypes = {
  magneticCaseInfo: magneticCaseTypes.isRequired,
  onClick: PropTypes.func.isRequired,
  tabIndex: PropTypes.number.isRequired,
  available: PropTypes.bool.isRequired,
};

export default magneticCase;
