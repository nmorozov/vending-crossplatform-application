import React from 'react';

import Tappable from 'react-tappable';

import PropTypes from 'prop-types';
import LanguageTypes from '../../types/languageTypes';

// Styles
import styles from './Language.scss';

const languageComponent = ({ language, onClick, tabIndex }) => (
  <div key={language.name} className={styles.language}>
    <Tappable role="button" tabIndex={tabIndex} onTouchEnd={onClick} preventDefault>
      <img src={language.image} alt={language.name} />
    </Tappable>
  </div>
);

languageComponent.propTypes = {
  language: LanguageTypes.isRequired,
  onClick: PropTypes.func.isRequired,
  tabIndex: PropTypes.number.isRequired,
};

export default languageComponent;
